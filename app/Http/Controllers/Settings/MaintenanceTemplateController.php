<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\MaintenanceTemplate;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\DB;

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
        // We use 'with('tasks')' to eager load the tasks for each template.
        // This prevents the "N+1 query problem" and is very efficient.
        $templates = MaintenanceTemplate::with('tasks')
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
     * This method performs a complete sync:
     * 1. Deletes tasks that are no longer in the list.
     * 2. Updates existing tasks (label, order).
     * 3. Creates new tasks.
     */
    public function syncTasks(Request $request, MaintenanceTemplate $maintenanceTemplate)
    {
        $validated = $request->validate([
            'tasks' => 'present|array',
            'tasks.*.id' => 'required|integer',
            'tasks.*.label' => 'required|string|max:255',
            'tasks.*.description' => 'nullable|string|max:2000',
            'tasks.*.task_type' => 'required|string',
            'tasks.*.options' => 'nullable|array',
        ]);

        $incomingTasks = $validated['tasks'];
        $incomingIds = collect($incomingTasks)->pluck('id')->toArray();

        DB::transaction(function () use ($maintenanceTemplate, $incomingTasks, $incomingIds) {
            // 1. Delete tasks that are in the DB but not in the incoming list.
            $maintenanceTemplate->tasks()->whereNotIn('id', $incomingIds)->delete();

            // 2. Update existing tasks and create new ones.
            foreach ($incomingTasks as $index => $taskData) {
                // If the ID is positive, it's an existing task.
                if ($taskData['id'] > 0) {
                    $task = $maintenanceTemplate->tasks()->find($taskData['id']);
                    if ($task) {
                        $task->update([
                            'label' => $taskData['label'],
                            'description' => $taskData['description'],
                            'order' => $index, // Update the order based on its position in the array
                            'options' => $taskData['options'],
                        ]);
                    }
                } else {
                    // If the ID is negative, it's a new task from the frontend.
                    $maintenanceTemplate->tasks()->create([
                        'label' => $taskData['label'],
                        'description' => $taskData['description'],
                        'task_type' => $taskData['task_type'],
                        'order' => $index,
                        'options' => $taskData['options'],
                    ]);
                }
            }
        });

        return Redirect::back()->with('success', 'Template tasks saved successfully.');
    }
}
