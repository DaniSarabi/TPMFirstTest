<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\MaintenanceTemplate;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Models\MaintenanceTemplateTask;
use App\Models\MaintenanceTemplateSection;
use Illuminate\Support\Facades\Log;


class MaintenanceTemplateController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * This method is responsible for rendering the main settings page.
     * It fetches all existing maintenance templates along with their tasks
     * and passes them as a prop to the Inertia frontend component.
     */
    public function index(): Response
    {
        $templates = MaintenanceTemplate::with(['sections.tasks', 'tasks'])
            ->orderBy('name')
            ->get();

        return Inertia::render('GeneralSettings/MaintenanceTemplates/Index', [
            'templates' => $templates,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:maintenance_templates,name',
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        MaintenanceTemplate::create($validated);

        return Redirect::route('settings.maintenance-templates.index')->with('success', 'Template created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MaintenanceTemplate $maintenanceTemplate)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:maintenance_templates,name,' . $maintenanceTemplate->id,
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $maintenanceTemplate->update($validated);

        return Redirect::back()->with('success', 'Template updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MaintenanceTemplate $maintenanceTemplate)
    {
        $maintenanceTemplate->delete();

        return Redirect::route('settings.maintenance-templates.index')->with('success', 'Template deleted successfully.');
    }
    /**
     * Synchronize the tasks for a given maintenance template.
     *
     * This method SHOULD perform a complete sync:
     * 1. Deletes tasks that are no longer in the list.
     * 2. Updates existing tasks (label, order).
     * 3. Creates new tasks.
     */
    public function syncLayout(Request $request, MaintenanceTemplate $maintenanceTemplate)
    {
        // ACTION: La validación ahora entiende la nueva estructura de datos anidada.
        $validated = $request->validate([
            'root_tasks' => 'present|array',
            'root_tasks.*.id' => 'required|integer',
            'root_tasks.*.label' => 'required|string|max:255',
            'root_tasks.*.description' => 'nullable|string|max:2000',
            'root_tasks.*.task_type' => ['required', 'string', Rule::in(['checkbox', 'pass_fail', 'numeric_input', 'text_observation', 'header', 'paragraph', 'bullet_list'])],
            'root_tasks.*.options' => 'present|json',
            'root_tasks.*.order' => 'required|integer', // Asegura que el 'order' venga


            'sections' => 'present|array',
            'sections.*.id' => 'required|integer',
            'sections.*.title' => 'required|string|max:255',
            'sections.*.description' => 'nullable|string|max:1000',
            'sections.*.order' => 'required|integer', // Asegura que el 'order' venga

            'sections.*.tasks' => 'present|array',
            'sections.*.tasks.*.id' => 'required|integer',
            'sections.*.tasks.*.label' => 'required|string|max:255',
            'sections.*.tasks.*.description' => 'nullable|string|max:2000',
            'sections.*.tasks.*.task_type' => ['required', 'string', Rule::in(['checkbox', 'pass_fail', 'numeric_input', 'text_observation', 'header', 'paragraph', 'bullet_list'])],
            'sections.*.tasks.*.options' => 'present|json',
            'sections.*.tasks.*.order' => 'required|integer', // Asegura que el 'order' venga

        ]);

        Log::info('BEFORE SYNC - All tasks in DB:', $maintenanceTemplate->tasks()->get()->toArray());


        Log::info('Incoming sections:', $validated['sections']);
        Log::info('Incoming root tasks:', $validated['root_tasks']);

        $incomingSections = $validated['sections'];
        $incomingRootTasks = $validated['root_tasks'];

        DB::transaction(function () use ($maintenanceTemplate, $incomingSections, $incomingRootTasks) {

            // --- PASO 1: DELETE TASKS (ALL TASKS, NOT JUST ROOT) ---

            $rootTaskIds = collect($incomingRootTasks)->pluck('id')->filter(fn($id) => $id > 0);
            $sectionTaskIds = collect($incomingSections)->pluck('tasks.*.id')->flatten()->filter(fn($id) => $id > 0);
            $allIncomingTaskIds = $rootTaskIds->merge($sectionTaskIds);
            // Elimina cualquier tarea del template que NO esté en la lista completa de IDs.
            // Esto maneja de forma segura las tareas eliminadas y las que se mueven.
            MaintenanceTemplateTask::where('maintenance_template_id', $maintenanceTemplate->id)
                ->whereNotIn('id', $allIncomingTaskIds)
                ->delete();

            // --- PASO 2: DELETE SECTIONS ---
            $incomingSectionIds = collect($incomingSections)->pluck('id')->filter(fn($id) => $id > 0);

            MaintenanceTemplateSection::where('maintenance_template_id', $maintenanceTemplate->id)
                ->whereNotIn('id', $incomingSectionIds)
                ->delete();


            // --- PASO 3: SINCRONIZAR SECCIONES (CON EL 'ORDER' CORRECTO) ---
            foreach ($incomingSections as $sectionData) {
                $section = MaintenanceTemplateSection::updateOrCreate(
                    [
                        'id' => $sectionData['id'] > 0 ? $sectionData['id'] : null,
                        'maintenance_template_id' => $maintenanceTemplate->id,
                    ],
                    [
                        'title' => $sectionData['title'],
                        'description' => $sectionData['description'],
                        'order' => $sectionData['order'],
                    ]
                );


                // --- PASO 4: SINCRONIZAR TAREAS DE SECCIÓN (CON EL 'ORDER' CORRECTO) ---
                foreach ($sectionData['tasks'] as $taskData) {
                    MaintenanceTemplateTask::updateOrCreate(
                        [
                            'id' => $taskData['id'] > 0 ? $taskData['id'] : null,
                            'maintenance_template_id' => $maintenanceTemplate->id,
                        ],
                        [
                            'section_id' => $section->id,
                            'label' => $taskData['label'],
                            'description' => $taskData['description'],
                            'task_type' => $taskData['task_type'],
                            'options' => json_decode($taskData['options'], true),
                            'order' => $taskData['order'],
                        ]
                    );
                }
            }

            // --- PASO 5: SINCRONIZAR TAREAS RAÍZ (CON EL 'ORDER' CORRECTO) ---
            foreach ($incomingRootTasks as $taskData) {
                MaintenanceTemplateTask::updateOrCreate(
                    [
                        'id' => $taskData['id'] > 0 ? $taskData['id'] : null,
                        'maintenance_template_id' => $maintenanceTemplate->id,
                    ],
                    [
                        'section_id' => null,
                        'label' => $taskData['label'],
                        'description' => $taskData['description'],
                        'task_type' => $taskData['task_type'],
                        'options' => json_decode($taskData['options'], true),
                        'order' => $taskData['order'],
                    ]
                );
            }
        });

        Log::info('AFTER SYNC - All tasks in DB:', $maintenanceTemplate->fresh()->tasks()->get()->toArray());

        return Redirect::back()->with('success', 'Template layout saved successfully.');
    }
}
