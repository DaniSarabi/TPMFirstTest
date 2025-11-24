<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use App\Models\DowntimeLog;
use App\Models\ScheduledMaintenance;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use App\Models\MaintenanceProgressSnapshot;
use App\Models\AiInsight;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        // 1. Definir Rangos de Fechas (Mensual)
        $thisMonthStart = now()->startOfMonth();
        $thisMonthEnd   = now()->endOfMonth();

        $lastMonthStart = now()->subMonth()->startOfMonth();
        $lastMonthEnd   = now()->subMonth()->endOfMonth();

        // * KPI's

        // ---------------------------------------------------------
        // KPI 1: Tickets Nuevos (Incoming Volume)
        // ---------------------------------------------------------
        $ticketsOpenedCurrent = Ticket::whereBetween('created_at', [$thisMonthStart, $thisMonthEnd])->count();
        $ticketsOpenedPrevious = Ticket::whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->count();

        // ---------------------------------------------------------
        // KPI 2: Tickets Cerrados (Output Volume)
        // ---------------------------------------------------------
        // Buscamos tickets que tuvieron un update de cierre en el rango de fechas
        $ticketsClosedCurrent = Ticket::whereHas('updates', function ($q) use ($thisMonthStart, $thisMonthEnd) {
            $q->whereBetween('created_at', [$thisMonthStart, $thisMonthEnd])
                ->whereHas('newStatus.behaviors', fn($b) => $b->where('name', 'is_ticket_closing_status'));
        })->count();

        $ticketsClosedPrevious = Ticket::whereHas('updates', function ($q) use ($lastMonthStart, $lastMonthEnd) {
            $q->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
                ->whereHas('newStatus.behaviors', fn($b) => $b->where('name', 'is_ticket_closing_status'));
        })->count();

        // ---------------------------------------------------------
        // KPI 3: Backlog Activo (Snapshot actual)
        // ---------------------------------------------------------
        // Tickets que NO están cerrados ni cancelados.
        // Ajusta 'is_ticket_closing_status' según tu lógica de negocio si tienes "Discarded".
        $activeBacklogCount = Ticket::whereHas('status.behaviors', function ($q) {
            $q->where('name', 'is_opening_status');
        })->count();

        // ---------------------------------------------------------
        // KPI 4: Progreso PM Mensual
        // ---------------------------------------------------------
        // Recuperamos snapshots (si usas ese sistema) o calculamos al vuelo.
        // Asumo que usas MaintenanceProgressSnapshot que se corre diario.
        $pmSnapshotCurrent = MaintenanceProgressSnapshot::where('date', today())->first();
        // Para comparar, tomamos el snapshot del MISMO día pero del mes pasado (ej. 20 Nov vs 20 Oct)
        $pmSnapshotPrevious = MaintenanceProgressSnapshot::where('date', today()->subMonth())->first();

        // ---------------------------------------------------------
        // EXTRA: AI Insights (Tips Activos)
        // ---------------------------------------------------------
        // Traemos los últimos 5 insights activos (pendientes o validados)
        // Usamos el scope 'visible' que definimos en el Modelo AiInsight
        $aiInsights = AiInsight::with([
            'machine:id,name',
            'technician:id,name',
            // TRAEMOS EL TICKET PARA VER SU ID Y SU ANÁLISIS JSON
            'ticket:id,ai_analysis_json'
        ])
            ->visible()
            ->latest()
            ->take(10)
            ->get();


        // * FLEET STATUS
        // ---------------------------------------------------------
        // DATA PARA WIDGET: FLEET STATUS TIMELINE (NUEVO)
        // ---------------------------------------------------------

        $todayStart = now()->startOfDay();
        $now = now();

        $machineTimelines = Machine::select('id', 'name') // Agrega 'image' si tienes fotos de máquinas
            ->orderBy('name')
            ->with(['downtimeLogs' => function ($query) use ($todayStart, $now) {
                // Esta logica trae logs que se "traslapan" con el día de hoy
                $query->where('start_time', '<=', $now) // Que hayan empezado antes de ahorita
                    ->where(function ($q) use ($todayStart) {
                        // Que sigan abiertos O que hayan terminado después de las 00:00 de hoy
                        $q->whereNull('end_time')
                            ->orWhere('end_time', '>=', $todayStart);
                    })
                    ->orderBy('start_time', 'asc');
            }])
            ->get()
            // Transformación opcional: Calcular el estatus actual en backend
            // para facilitar la vida al frontend
            ->map(function ($machine) {
                // Buscamos si hay algún log activo (sin end_time)
                $activeLog = $machine->downtimeLogs->first(fn($log) => is_null($log->end_time));

                $machine->current_status = $activeLog ? $activeLog->category : 'Operational';
                $machine->active_log_start = $activeLog ? $activeLog->start_time : null;

                return $machine;
            });

        // * PARETO
        // ---------------------------------------------------------
        // DATA PARA WIDGET: DOWNTIME DISTRIBUTION (PARETO)
        // ---------------------------------------------------------
        // Obtenemos todos los logs que iniciaron este mes
        $downtimePareto = DowntimeLog::whereBetween('start_time', [$thisMonthStart, $now])
            ->get()
            ->map(function ($log) {
                // Calculamos duración en PHP para manejar logs abiertos (end_time = null)
                $start = Carbon::parse($log->start_time);
                $end = $log->end_time ? Carbon::parse($log->end_time) : now();

                return [
                    'category' => $log->category,
                    'minutes' => $start->diffInMinutes($end)
                ];
            })
            ->groupBy('category')
            ->map(function ($group, $category) {
                return [
                    'category' => $category,
                    'total_minutes' => $group->sum('minutes'),
                    'count' => $group->count() // Opcional: cuántas veces falló
                ];
            })
            ->values() // Reset keys para que sea array JSON
            ->sortByDesc('total_minutes') // Pareto: El mayor dolor primero
            ->values()
            ->all();




        // * Avg Resolution

        // ---------------------------------------------------------
        // DATA PARA WIDGET: RELIABILITY & EFFICIENCY TRENDS (6 MESES)
        // ---------------------------------------------------------

        // Variable para "recordar" el último valor conocido (Forward Fill)
        // Iniciamos en 0 o null. Si quieres que empiece vacío hasta el primer dato, usa null.
        // A. DATA DIARIA (Últimos 30 días) - Usamos Ventana Móvil de 7 días para suavizar
        $dailyTrend = collect(range(29, 0))->map(function ($i) {
            $datePoint = now()->subDays($i);

            // Ventana Móvil: Promedio de los últimos 7 días hasta la fecha punto
            $windowStart = $datePoint->copy()->subDays(7)->startOfDay();
            $windowEnd   = $datePoint->copy()->endOfDay();

            $closedTickets = Ticket::whereHas('updates', function ($q) use ($windowStart, $windowEnd) {
                $q->whereBetween('created_at', [$windowStart, $windowEnd])
                    ->whereHas('newStatus.behaviors', fn($b) => $b->where('name', 'is_ticket_closing_status'));
            })->with(['updates' => function ($q) {
                $q->orderBy('created_at');
            }])->get();

            // Si no hubo tickets cerrados en toda la semana, devolvemos null (hueco en la gráfica)
            if ($closedTickets->isEmpty()) {
                return ['date' => $datePoint->format('d M'), 'hours' => null, 'count' => 0];
            }

            $avgHours = $closedTickets->map(function ($ticket) {
                $created = $ticket->created_at;
                $closingUpdate = $ticket->updates->filter(fn($u) => $u->newStatus && $u->newStatus->behaviors->contains('name', 'is_ticket_closing_status'))->last();
                $closed = $closingUpdate ? $closingUpdate->created_at : now();
                return $created->diffInMinutes($closed) / 60;
            })->avg();

            return [
                'date' => $datePoint->format('d M'), // Ej: "21 Nov"
                'hours' => round($avgHours, 1),
                'count' => $closedTickets->count()
            ];
        })->values();

        // B. DATA MENSUAL (Últimos 12 meses) - Promedio puro del mes
        $monthlyTrend = collect(range(11, 0))->map(function ($i) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd   = now()->subMonths($i)->endOfMonth();

            $closedTickets = Ticket::whereHas('updates', function ($q) use ($monthStart, $monthEnd) {
                $q->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->whereHas('newStatus.behaviors', fn($b) => $b->where('name', 'is_ticket_closing_status'));
            })->with(['updates' => function ($q) {
                $q->orderBy('created_at');
            }])->get();

            if ($closedTickets->isEmpty()) {
                return ['date' => $monthStart->format('M'), 'full_date' => $monthStart->format('M Y'), 'hours' => null, 'count' => 0];
            }

            $avgHours = $closedTickets->map(function ($ticket) {
                $created = $ticket->created_at;
                $closingUpdate = $ticket->updates->filter(fn($u) => $u->newStatus && $u->newStatus->behaviors->contains('name', 'is_ticket_closing_status'))->last();
                $closed = $closingUpdate ? $closingUpdate->created_at : now();
                return $created->diffInMinutes($closed) / 60;
            })->avg();

            return [
                'date' => $monthStart->format('M'), // Ej: "Nov"
                'full_date' => $monthStart->format('M Y'), // Para tooltip
                'hours' => round($avgHours, 1),
                'count' => $closedTickets->count()
            ];
        })->values();




        // ---------------------------------------------------------
        // DATA PARA WIDGET: FAILURE PARETO (AI vs TECH)
        // ---------------------------------------------------------

        // Función Helper (Closure) para no repetir lógica
        $getParetoData = function ($startDate) use ($now) {
            $closedTickets = Ticket::whereBetween('created_at', [$startDate, $now])
                ->whereHas('status.behaviors', fn($q) => $q->where('name', 'is_ticket_closing_status'))
                ->with(['updates' => function ($q) {
                    $q->whereNotNull('category')->latest();
                }])
                ->get();

            $calculate = function ($grouped) {
                $total = $grouped->sum();
                $runningTotal = 0;
                return $grouped->sortDesc()->map(function ($count, $name) use ($total, &$runningTotal) {
                    $runningTotal += $count;
                    return [
                        'name' => substr($name, 0, 15) . (strlen($name) > 15 ? '...' : ''),
                        'full_name' => $name,
                        'count' => $count,
                        'cumulative' => $total > 0 ? round(($runningTotal / $total) * 100, 1) : 0
                    ];
                })->values()->take(10);
            };

            return [
                'ai' => $calculate($closedTickets->groupBy(fn($t) => $t->ai_analysis_json['ai_subcategory_1'] ?? 'N/A')->map->count()),
                'tech' => $calculate($closedTickets->groupBy(fn($t) => $t->updates->first()->category ?? 'N/A')->map->count())
            ];
        };

        // Calculamos los 3 escenarios
        $paretoData = [
            '1M'  => $getParetoData(now()->startOfMonth()),
            '6M'  => $getParetoData(now()->subMonths(6)->startOfMonth()),
            'YTD' => $getParetoData(now()->startOfYear())
        ];


        // ---------------------------------------------------------
        // DATA PARA WIDGET: AI PARTS TRACKER (CONSUMO DE REFACCIONES)
        // ---------------------------------------------------------
        // Función Helper para extraer partes de un rango de fechas
        $getPartsData = function ($startDate) use ($now) {
            // Cargamos los tickets con la relación de máquina para saber dónde se usó
            $tickets = Ticket::with('machine:id,name')
                ->whereBetween('created_at', [$startDate, $now])
                ->whereNotNull('ai_analysis_json')
                ->get();

            // Aplanamos para tener items individuales: [Parte, Maquina]
            $allParts = $tickets->flatMap(function ($ticket) {
                $parts = $ticket->ai_analysis_json['standardized_parts'] ?? [];
                $machineName = $ticket->machine->name ?? 'Unknown';

                // Retornamos pares de (Parte, Maquina)
                return collect($parts)->map(fn($p) => ['name' => $p, 'machine' => $machineName]);
            });

            // Agrupamos por nombre de la parte
            return $allParts->groupBy('name')->map(function ($group, $partName) {
                // Obtenemos lista única de máquinas donde se usó
                $machines = $group->pluck('machine')->unique()->values()->all();

                return [
                    'name' => $partName,
                    'count' => $group->count(),
                    'machines' => $machines // Lista de nombres de máquinas
                ];
            })
                ->sortByDesc('count')
                ->values()
                ->take(10);
        };

        $partsTrackerData = [
            '1M'  => $getPartsData(now()->startOfMonth()),
            '6M'  => $getPartsData(now()->subMonths(6)->startOfMonth()),
            'YTD' => $getPartsData(now()->startOfYear())
        ];
        // ---------------------------------------------------------

        return Inertia::render('Dashboard/Index', [
            'machineTimelines' => $machineTimelines,
            'downtimePareto' => $downtimePareto,
            'metrics' => [
                'incomingTickets' => [
                    'current' => $ticketsOpenedCurrent,
                    'previous' => $ticketsOpenedPrevious
                ],
                'resolvedTickets' => [
                    'current' => $ticketsClosedCurrent,
                    'previous' => $ticketsClosedPrevious
                ],
                'activeBacklog' => $activeBacklogCount,
                'pmProgress' => [
                    'current' => $pmSnapshotCurrent,
                    'previous' => $pmSnapshotPrevious
                ],
            ],
            'aiInsights' => $aiInsights,
            'resolutionTrend' => [
                'daily' => $dailyTrend,
                'monthly' => $monthlyTrend
            ],
            'failurePareto' => $paretoData,
            'partsTracker' => $partsTrackerData

        ]);
    }

    private function calculateReliabilityMetrics($start, $end, $machines, $labelName)
    {
        // 1. MODO CRITICO (Ajustado a Turno 10h)
        // Si el rango es de 1 día, multiplicamos por 10h. Si es mes, por días del mes * 10h.
        $daysInPeriod = $start->diffInDays($end) ?: 1; // Si es el mismo día, diff es 0, forzamos 1
        $hoursPerShift = 10;
        $totalMachineHours = $machines->count() * $daysInPeriod * $hoursPerShift;

        $downtimeLogs = DowntimeLog::whereBetween('start_time', [$start, $end])->get();

        $totalDowntimeHours = $downtimeLogs->sum(function ($log) use ($end) {
            $logStart = Carbon::parse($log->start_time);
            $logEnd = $log->end_time ? Carbon::parse($log->end_time) : now(); // Si sigue abierto, cuenta hasta "ahora"
            // Clamping: Si el log termina después del periodo, cortarlo al final del periodo
            if ($logEnd > $end) $logEnd = $end;

            return $logStart->diffInMinutes($logEnd) / 60;
        });

        $failureCount = $downtimeLogs->where('category', 'Corrective')->count(); // Solo fallas reales para MTBF? O todas? Ajusta según tu criterio.

        // Fórmulas
        $mtbf = $failureCount > 0 ? ($totalMachineHours - $totalDowntimeHours) / $failureCount : $totalMachineHours;
        $mttr = $failureCount > 0 ? $totalDowntimeHours / $failureCount : 0;

        // 2. MODO GENERAL
        $closedTickets = Ticket::whereHas('updates', function ($q) use ($start, $end) {
            $q->whereBetween('created_at', [$start, $end])
                ->whereHas('newStatus.behaviors', fn($b) => $b->where('name', 'is_ticket_closing_status'));
        })->with('updates')->get();

        $avgResolution = $closedTickets->map(function ($t) {
            $created = $t->created_at;
            $closed = $t->updates->last()->created_at ?? now();
            return $created->diffInHours($closed);
        })->avg() ?? 0;

        return [
            'name' => $labelName,
            'mtbf' => round($mtbf, 1),
            'mttr' => round($mttr, 1),
            'avg_resolution' => round($avgResolution, 1),
            'tickets_closed' => $closedTickets->count()
        ];
    }
}
