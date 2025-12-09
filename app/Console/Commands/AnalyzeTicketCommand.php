<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Models\AiInsight;
use Illuminate\Console\Command;
use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Support\Facades\Log;
use App\Events\TechnicianCoachingTriggered;

class AnalyzeTicketCommand extends Command
{
    protected $signature = 'tpm:analyze-ticket {ticket_id?} {--auto : Si se activa, busca los ultimos 5 tickets pendientes automaticamente}';
    protected $description = 'Analiza tickets cerrados usando IA para generar insights y detectar recurrencia.';

    // ==========================================
    // 1. SCHEMA BLINDADO (Lista de Insights)
    // ==========================================
    private function getAnalysisSchema(): array
    {
        return [
            'type' => 'object',
            'additionalProperties' => false,
            'properties' => [
                'technician_category_preserved' => ['type' => 'string', 'description' => 'Categoría original seleccionada por el técnico.'],
                'ai_subcategory_1' => ['type' => 'string', 'description' => 'Subcategoría técnica corregida (Sentence case). Ej: "Falla de sensor".'],
                'ai_subcategory_2' => ['type' => 'string', 'description' => 'Causa raíz profunda inferida.'],
                'standardized_parts' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'Lista de partes normalizadas. Ej: ["Manguera", "Conector"].'],
                'is_recurrent' => ['type' => 'boolean', 'description' => 'True si el problema parece repetitivo basado en el historial.'],
                'recurrence_reference_ids' => [
                    'type' => 'array',
                    'items' => ['type' => 'integer'],
                    'description' => 'Si is_recurrent es true, lista aquí los IDs de los tickets del historial que son SIMILARES a la falla actual. Si no hay, deja vacío.'
                ],
                'confidence' => ['type' => 'number'],

                // LISTA DE INSIGHTS (Para tu tabla nueva)
                'strategic_insights_list' => [
                    'type' => 'array',
                    'description' => 'Lista de consejos accionables para técnicos o supervisores.',
                    'items' => [
                        'type' => 'object',
                        'additionalProperties' => false,
                        'properties' => [
                            'category' => [
                                'type' => 'string',
                                'enum' => ['COACHING_OPPORTUNITY', 'MACHINE_HEALTH_TIP', 'RECURRENCE_ALERT', 'GENERAL_INFO'],
                                'description' => 'Tipo de acción requerida.'
                            ],
                            'message' => ['type' => 'string', 'description' => 'El consejo o alerta específica.']
                        ],
                        'required' => ['category', 'message']
                    ]
                ]
            ],
            'required' => ['technician_category_preserved', 'ai_subcategory_1', 'ai_subcategory_2', 'standardized_parts', 'recurrence_reference_ids', 'strategic_insights_list', 'is_recurrent', 'confidence']
        ];
    }

    // ==========================================
    // 2. PROMPT DEL SISTEMA
    // ==========================================
    private function buildSystemPrompt(): string
    {
        return <<<EOT
                    Eres un Ingeniero Experto en Análisis de Fallas TPM. Analiza el ticket cerrado y genera datos estructurados.

                    CONTEXTO DE LA MÁQUINA: Utiliza el campo 'MACHINE_INFO.FUNCTION_DESCRIPTION' para entender la criticidad y función del equipo. Si la falla afecta la función principal descrita, considera dar un 'MACHINE_HEALTH_TIP'.
                    OBJETIVOS:
                    1.**Normalización de Partes (CRÍTICO):** - Consulta la lista 'EXISTING_PARTS_DB'.
                        - Si la parte mencionada por el técnico es sinónimo o similar a una existente en esa lista, **USA EL NOMBRE DE LA LISTA** para mantener el inventario limpio.
                        - Solo crea un nombre nuevo si la parte es genuinamente nueva. Usa formato: "Nombre Genérico + Especificación" (Ej: "Rodamiento 6204").
                    2. **Categorización Estandarizada (ai_subcategory_1):**
                        - Consulta la lista 'EXISTING_CATEGORIES_DB'.
                        - Trata de clasificar la falla dentro de una de las categorías existentes en esa lista si tiene sentido técnico. (Ej: Si existe "Falla de Sensor" y el problema es "Sensor roto", usa "Falla de Sensor").
                        - Si NINGUNA categoría existente describe bien el problema, crea una nueva que sea breve y descriptiva (Sentence case).
                    3. Genera 'strategic_insights_list' para poblar el dashboard:
                        - Usa 'COACHING_OPPORTUNITY' si el reporte es vago o tiene mala calidad, como mejorar la calidad de la documentacion.
                        - Usa 'MACHINE_HEALTH_TIP' si detectas un patrón de desgaste útil para prevenir fallas.
                        - Usa 'RECURRENCE_ALERT' si el historial muestra que esta falla se repite mucho o que se va a repetir en cuanto tiempo aproximadamente, si la causa raiz no esta siendo erradicada.
                    
                    REGLAS CRÍTICAS DE RECURRENCIA:
                    1. **Comparación Estricta:** Solo marca 'is_recurrent' = true si la falla del TICKET ACTUAL es físicamente similar a alguna del historial, no te lo tomes a la.
                        - Ejemplo: Si el actual es "Fusible quemado" y el historial tiene "Fuga de aceite", **NO ES RECURRENTE**. Son sistemas diferentes (Eléctrico vs Hidráulico).
                        - Ejemplo: Si el actual es "Fusible quemado" y el historial tiene "Corto en cable", **SÍ PUEDE SER RECURRENTE** (Ambos eléctricos).
                    2. **Evidencia:** Si detectas recurrencia, añade los IDs de los tickets pasados en 'recurrence_reference_ids'.
                    3. **Alucinaciones:** NO inventes problemas. Puedes dar recomendaciones o posibles cosas por las que ver, pero siempre como eso, se recomienda.

                    REGLAS DE INSIGHTS:
                        - Si generas una alerta RECURRENCE_ALERT, menciona explícitamente: "Esta falla coincide con los tickets #ID, #ID previos."
                    Usa ortografía técnica correcta (Sentence case).
                EOT;
    }

    // ==========================================
    // 3. CONTEXTO (Extracción de Datos)
    // ==========================================
    private function getTicketContext(Ticket $ticket): array
    {
        // Cargar relaciones necesarias
        $ticket->load(['creator', 'machine', 'updates.user', 'attachments.uploader', 'inspectionItem']);

        $resolution = $ticket->updates->whereNotNull('action_taken')->last();
        $creation = $ticket->updates->first();

        // --- 1. CONSTRUCCIÓN INTELIGENTE DEL HISTORIAL ---

        // Base: Tickets anteriores de la misma máquina que ya tengan IA
        $historyQuery = Ticket::where('machine_id', $ticket->machine_id)
            ->where('id', '<', $ticket->id)
            ->whereNotNull('ai_analysis_json');

        // FILTRO CRÍTICO: Si este ticket nació de un Punto de Inspección, 
        // obligamos a que el historial sea SOLO de ese mismo punto físico.
        if ($ticket->inspection_report_item_id && $ticket->inspectionItem) {
            $pointId = $ticket->inspectionItem->inspection_point_id;

            $historyQuery->whereHas('inspectionItem', function ($q) use ($pointId) {
                $q->where('inspection_point_id', $pointId);
            });
        }
        // Si es un ticket manual (sin punto), dejamos que vea toda la máquina 
        // pero confiamos en el Prompt estricto para diferenciar Eléctrico vs Mecánico.

        $prevHistory = $historyQuery->latest()
            ->take(10)
            ->get()
            ->map(fn($t) => [
                'ticket_id' => $t->id,
                'date' => $t->created_at->format('Y-m-d'),
                'issue' => $t->ai_analysis_json['ai_subcategory_1'] ?? 'N/A',
                'root_cause' => $t->ai_analysis_json['ai_subcategory_2'] ?? 'N/A',
            ]);
        // Consolidar adjuntos y comentarios (Tu lógica)
        $attachmentsLog = $ticket->attachments->map(fn($a) => "File: {$a->file_name} ({$a->description})")->implode('; ');


        $existingParts = $this->getExistingPartsCatalog();
        $existingCategories = $this->getExistingCategoriesCatalog();

        return [
            'CURRENT_TICKET' => [
                'ID' => $ticket->id,

                // --- AQUI AGREGAMOS EL CONTEXTO DE LA MAQUINA ---
                'MACHINE_INFO' => [
                    'NAME' => $ticket->machine->name ?? 'N/A',
                    'FUNCTION_DESCRIPTION' => $ticket->machine->description ?? 'Sin descripción disponible.', // <--- ESTO ES LO NUEVO
                ],

                'PRIORITY' => $ticket->priority === 2 ? 'CRITICAL' : 'NORMAL',
                'DESCRIPTION' => $creation->comment ?? $ticket->description,
                'SOLUTION' => $resolution->action_taken ?? 'N/A',
                'PARTS_RAW' => $resolution->parts_used ?? 'N/A',
                'CATEGORY_RAW' => $resolution->category ?? 'N/A',
                'ATTACHMENTS' => $attachmentsLog ?: 'Sin adjuntos.',
            ],
            'HISTORY_FOR_COMPARISON' => $prevHistory,
            'EXISTING_PARTS_DB' => $existingParts,
            'EXISTING_CATEGORIES_DB' => $existingCategories 

        ];
    }

    // ==========================================
    // 4. EJECUCIÓN (HANDLE)
    // ==========================================
    public function handle()
    {
        $ticketId = $this->argument('ticket_id');
        $isAuto = $this->option('auto');

        // Estrategia: ¿Uno especifico o Lote automatico?
        if ($ticketId) {
            $tickets = Ticket::where('id', $ticketId)->get();
        } elseif ($isAuto) {
            // Buscar tickets cerrados que aun no tienen análisis (ai_processed_at NULL)
            $this->info("Modo Auto: Buscando tickets pendientes...");

            $tickets = Ticket::whereHas('status.behaviors', function ($q) {
                // Filtro: Que tenga el comportamiento de cierre
                $q->where('name', 'is_ticket_closing_status');
            })
                ->whereNull('ai_processed_at') // Que no lo hayamos analizado antes
                ->take(10) // Lote pequeño para no saturar
                ->get();
        } else {
            $this->error("Debes especificar un ID o usar --auto");
            return;
        }

        $this->info("Procesando " . $tickets->count() . " tickets...");

        foreach ($tickets as $ticket) {
            $this->processSingleTicket($ticket);
        }
    }
    /**
     * Obtiene un catálogo de partes ya usadas en el sistema para consistencia.
     */
    private function getExistingPartsCatalog(): array
    {
        // Tomamos los últimos 300 tickets analizados para tener una muestra representativa
        // pero sin enviar un JSON de 5MB a la API.
        return Ticket::whereNotNull('ai_analysis_json')
            ->latest()
            ->take(300)
            ->get()
            ->flatMap(function ($ticket) {
                return $ticket->ai_analysis_json['standardized_parts'] ?? [];
            })
            ->unique() // Eliminar duplicados
            ->sort()
            ->values()
            ->all();
    }
    /**
     * Obtiene un catálogo de categorías (ai_subcategory_1) ya usadas para evitar duplicados.
     */
    private function getExistingCategoriesCatalog(): array
    {
        return Ticket::whereNotNull('ai_analysis_json')
            ->latest()
            ->take(300)
            ->get()
            ->map(fn($t) => $t->ai_analysis_json['ai_subcategory_1'] ?? null)
            ->filter() // Quitar nulos
            ->unique()
            ->sort()
            ->values()
            ->all();
    }

    private function processSingleTicket(Ticket $ticket)
    {
        $this->line("Analizando Ticket #{$ticket->id}...");

        try {
            $context = $this->getTicketContext($ticket);

            $response = OpenAI::chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => $this->buildSystemPrompt()],
                    ['role' => 'user', 'content' => json_encode($context)]
                ],
                'response_format' => [
                    'type' => 'json_schema',
                    'json_schema' => [
                        'name' => 'tpm_analysis',
                        'strict' => true,
                        'schema' => $this->getAnalysisSchema()
                    ]
                ]
            ]);

            $analysis = json_decode($response->choices[0]->message->content, true);

            // A. GUARDADO HISTÓRICO (JSON)
            $ticket->ai_analysis_json = $analysis;
            $ticket->ai_processed_at = now();
            $ticket->save();

            $resolvingTechnician = null;
            $resolutionUpdate = $ticket->updates()
                ->whereNotNull('action_taken')
                ->with('user')
                ->latest()
                ->first();

            if (!$resolutionUpdate) {
                $resolutionUpdate = $ticket->updates()
                    ->whereHas('newStatus.behaviors', fn($q) => $q->where('name', 'is_ticket_closing_status'))
                    ->with('user')
                    ->latest()
                    ->first();
            }
            $resolvingTechnician = $resolutionUpdate ? $resolutionUpdate->user : null;

            if (!$resolvingTechnician) {
                $this->warn("   -> No se encontró técnico resolutor para Ticket #{$ticket->id}. Insights se guardarán sin user_id.");
            }
            // B. GUARDADO DE INSIGHTS (TABLA NUEVA)
            if (!empty($analysis['strategic_insights_list'])) {
                foreach ($analysis['strategic_insights_list'] as $insight) {

                    $finalContent = $insight['message'];
                    // Si es una alerta de recurrencia y la IA nos dio IDs culpables...
                    if ($insight['category'] === 'RECURRENCE_ALERT' && !empty($analysis['recurrence_reference_ids'])) {
                        $ids = implode(', #', $analysis['recurrence_reference_ids']);
                        $finalContent .= " (Ref: Tickets #{$ids})";
                    }
                    // 1. Guardar en la tabla 'post-it'
                    AiInsight::create([
                        'ticket_id' => $ticket->id,
                        'machine_id' => $ticket->machine_id,
                        'user_id' => $resolvingTechnician?->id,
                        'type' => $insight['category'],
                        'content' => $finalContent, // <--- Usamos la variable modificada
                        'status' => 'pending'
                    ]);

                    $this->line("   -> Insight generado: [{$insight['category']}]");

                    // 2. Disparar Eventos (Solo Coaching por ahora)
                    if ($insight['category'] === 'COACHING_OPPORTUNITY') {
                        if ($resolvingTechnician) {
                            event(new TechnicianCoachingTriggered($ticket, $insight['message']));
                            $this->warn("      ⚡ Evento de Coaching disparado para '{$resolvingTechnician->name}'.");
                        } else {
                            $this->error("      ❌ No se pudo enviar Coaching: Técnico resolutor no identificado.");
                        }
                    }
                }
            } else {
                $this->info("   -> No se generaron insights accionables para este ticket.");
            }

            $this->info("✅ Ticket #{$ticket->id} completado.");
        } catch (\Exception $e) {
            $this->error("❌ Error en Ticket #{$ticket->id}: " . $e->getMessage());
            Log::error("TPM AI Error: " . $e->getMessage());
        }
    }
}
