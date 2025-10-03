<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceReport;
use App\Models\ScheduledMaintenance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use App\Services\TagManagerService;
use App\Models\Tag;
use App\Models\Machine;
use App\Services\DowntimeService;

class PerformMaintenanceController extends Controller
{
    /**
     * Show the form for performing a scheduled maintenance.
     * This method now gets an existing report or creates a new one.
     */
    public function show(ScheduledMaintenance $scheduledMaintenance): Response | \Illuminate\Http\RedirectResponse
    {
        // --- FIX: Implement the two-way grace period logic ---
        $today = Carbon::today();
        $scheduledDate = Carbon::parse($scheduledMaintenance->scheduled_date);
        $gracePeriod = $scheduledMaintenance->grace_period_days;

        // Calculate the start and end of the allowed window
        $windowStart = $scheduledDate->copy()->subDays($gracePeriod);
        $windowEnd = $scheduledDate->copy()->addDays($gracePeriod);

        // Check if today is outside of the allowed window
        if ($today->lt($windowStart)) {
            return Redirect::route('maintenance-calendar.index')
                ->with('error', 'This maintenance cannot be performed until ' . $windowStart->format('M d, Y') . '.');
        }

        $report = $scheduledMaintenance->report()->firstOrCreate(
            ['scheduled_maintenance_id' => $scheduledMaintenance->id],
            [
                'user_id' => Auth::id(),
                'completed_at' => now(),
            ]
        );

        if ($report->wasRecentlyCreated) {
            foreach ($scheduledMaintenance->template->tasks as $task) {
                $report->results()->create([
                    'task_label' => $task->label,
                    'result' => null,
                ]);
            }
            // $scheduledMaintenance->update(['status' => 'in_progress']);
        }

        // --- NEW FIX: Load all relationships onto the parent object ---
        // This is a more reliable way to ensure all data is available on the frontend.
        $scheduledMaintenance->load([
            'report.results.photos', // Load the report and its results
            'template.sections.tasks',
            'template.tasks',
            'schedulable'
        ]);

        // Pass the main scheduledMaintenance object to the view
        return Inertia::render('PerformMaintenance/Index', [
            'scheduledMaintenance' => $scheduledMaintenance,
        ]);
    }
    /**
     * ACTION: This method has been refactored for our new "Smart Start" logic.
     * It now updates the maintenance record and then delegates to the Downtime Resolver.
     */
    public function start(Request $request, ScheduledMaintenance $scheduledMaintenance, TagManagerService $tagManager, DowntimeService $downtimeService)
    {
        $validated = $request->validate([
            'log_downtime' => 'required|boolean',
        ]);

        $machine = $scheduledMaintenance->schedulable_type === 'App\\Models\\Machine'
            ? $scheduledMaintenance->schedulable
            : $scheduledMaintenance->schedulable->machine;

        // 1. Always apply the informational 'under-maintenance' tag.
        $tagManager->applyTag($machine, 'under-maintenance', $scheduledMaintenance);


        // 2. Update the maintenance status and the new is_critical flag.
        $newStatus = $scheduledMaintenance->status === 'overdue' ? 'in_progress_overdue' : 'in_progress';
        $scheduledMaintenance->update([
            'status' => $newStatus,
            'is_critical' => $validated['log_downtime'], // Set the flag based on user input.
        ]);

        // 3. Ensure the report exists.
        $scheduledMaintenance->report()->updateOrCreate(
            ['scheduled_maintenance_id' => $scheduledMaintenance->id],
            ['user_id' => Auth::id()]
        );
        if ($validated['log_downtime']) {
            $tagManager->applyTag($machine, 'out-of-service', $scheduledMaintenance);
        }
        // 4. After all data is updated, tell the "Downtime Boss" to re-evaluate the machine's state.
        $downtimeService->resolveDowntime($machine);

        return Redirect::back()->with('success', 'Maintenance has been started.');
    }
    /**
     * Save the current progress of a maintenance report.
     */
    public function saveProgress(Request $request, ScheduledMaintenance $scheduledMaintenance)
    {
        // This method remains unchanged and works correctly.
        $validated = $request->validate([
            'results' => 'present|array',
            'notes' => 'nullable|string',
        ]);
        $this->updateReportData($request, $scheduledMaintenance, $validated);
        return Redirect::back()->with('success', 'Progress saved successfully.');
    }

    /**
     * Submit the final maintenance report.
     */
    public function submitReport(Request $request, ScheduledMaintenance $scheduledMaintenance, TagManagerService $tagManager, DowntimeService $downtimeService)
    {
        // FIX: Get ALL tasks (root tasks + section tasks)
        $rootTasks = $scheduledMaintenance->template->tasks;
        $sectionTasks = $scheduledMaintenance->template->sections->flatMap(fn($section) => $section->tasks);
        $allTasks = $rootTasks->merge($sectionTasks);
        $templateTasks = $allTasks->keyBy('label');

        $resultsData = $request->input('results', []);

        $validator = Validator::make($request->all(), [
            'notes' => 'nullable|string',
            'results' => 'present|array',
            'results.*.task_label' => 'required|string',
            'results.*.result' => 'nullable',
            'results.*.comment' => 'nullable|string',
            'results.*.photos' => 'nullable|array',
            'results.*.photos.*' => 'image|max:10240',
        ]);

        // --- Custom validation logic for mandatory fields ---
        $validator->after(function ($validator) use ($request, $resultsData, $templateTasks, $scheduledMaintenance) {
            foreach ($resultsData as $index => $resultData) {
                $taskLabel = $resultData['task_label'] ?? null;
                $task = $templateTasks->get($taskLabel);

                if (!$task) continue;

                // Skip content blocks (they don't need validation)
                if (in_array($task->task_type, ['header', 'paragraph', 'bullet_list'])) {
                    continue;
                }

                $isMandatory = $task->options['is_mandatory'] ?? false;
                $photoRequirement = $task->options['photo_requirement'] ?? 'disabled';
                $commentRequirement = $task->options['comment_requirement'] ?? 'disabled';

                // 1. Check if the task itself is mandatory and has a result
                if ($isMandatory && (is_null($resultData['result']) || $resultData['result'] === '')) {
                    $validator->errors()->add("results.{$index}.result", "This task is mandatory and requires a response.");
                }

                // 2. Check for mandatory photo
                if ($photoRequirement === 'mandatory') {
                    $hasNewPhoto = $request->hasFile("results.{$index}.photos");
                    $reportResult = $scheduledMaintenance->report?->results()->where('task_label', $taskLabel)->first();
                    $hasExistingPhotos = $reportResult && $reportResult->photos()->count() > 0;

                    if (!$hasNewPhoto && !$hasExistingPhotos) {
                        $validator->errors()->add("results.{$index}.result", "A photo is required for this task.");
                    }
                }

                // 3. Check for mandatory comment
                if ($commentRequirement === 'mandatory') {
                    $comment = $resultData['comment'] ?? '';
                    if (empty(trim($comment))) {
                        $validator->errors()->add("results.{$index}.comment", "A comment is required for this task.");
                    }
                }
            }
        });

        // If validation fails, redirect back with the errors AND the user's input.
        if ($validator->fails()) {
            return Redirect::back()->withErrors($validator)->withInput()->with('error', 'There are validation errors, please check your input.');
        }

        // If validation passes, proceed with saving
        $validated = $validator->validated();
        $report = $this->updateReportData($request, $scheduledMaintenance, $validated);

        $isOverdue = in_array($scheduledMaintenance->status, ['overdue', 'in_progress_overdue']);

        $finalStatus = $isOverdue ? 'completed_overdue' : 'completed';

        $report->update(['completed_at' => now()]);
        $scheduledMaintenance->update([
            'status' => $finalStatus,
            'is_critical' => false,
        ]);

        $machine = $scheduledMaintenance->schedulable_type === 'App\\Models\\Machine'
            ? $scheduledMaintenance->schedulable
            : $scheduledMaintenance->schedulable->machine;

        if ($machine) {
            $downtimeService->resolveDowntime($machine);
            $this->cleanupInformationalTags($machine, $scheduledMaintenance, $tagManager);
        }

        return Redirect::route('maintenance-calendar.index')->with('success', 'Maintenance report submitted successfully.');
    }

    /**
     * Helper method to update report data.
     */
    private function updateReportData(Request $request, ScheduledMaintenance $scheduledMaintenance, array $validated)
    {
        $report = $scheduledMaintenance->report;
        if (!$report) {
            abort(404, 'Report not found.');
        }

        $report->update(['notes' => $validated['notes']]);

        foreach ($validated['results'] as $key => $resultData) {
            $result = $report->results()->updateOrCreate(
                ['task_label' => $resultData['task_label']],
                [
                    'result' => $resultData['result'],
                    'comment' => $resultData['comment'],
                ]
            );

            if ($request->hasFile("results.{$key}.photos")) {
                foreach ($request->file("results.{$key}.photos") as $photo) {
                    $photoPath = $photo->store('maintenance-photos', 'public');
                    $result->photos()->create(['photo_url' => $photoPath]);
                }
            }
        }
        return $report;
    }

    /**
     * Helper method for cleaning up informational maintenance tags.
     */
    private function cleanupInformationalTags(Machine $machine, ScheduledMaintenance $completedMaintenance, TagManagerService $tagManager)
    {
        //  --- Under Maintenance Check ---

        $hasOtherInProgress = $machine->scheduledMaintenances()
            ->where('id', '!=', $completedMaintenance->id)
            ->whereIn('status', ['in_progress', 'in_progress_overdue'])
            ->exists();

        if ($hasOtherInProgress) {
            $tagManager->applyTag($machine, 'under-maintenance');
        } else {
            $tagManager->removeTag($machine, 'under-maintenance');
        }

        // --- Overdue Check ---
        $hasOtherOverdue = $machine->scheduledMaintenances()
            ->where('id', '!=', $completedMaintenance->id)
            ->where('status', 'overdue')
            ->exists();

        if ($hasOtherOverdue) {
            $tagManager->applyTag($machine, 'maintenance-overdue');
        } else {
            $tagManager->removeTag($machine, 'maintenance-overdue');
        }

        // --- Upcoming/Due Check ---
        $hasOtherUpcoming = $machine->scheduledMaintenances()
            ->where('id', '!=', $completedMaintenance->id)
            ->whereNotIn('status', ['completed', 'completed_overdue'])
            ->exists();

        if ($hasOtherUpcoming) {
            $tagManager->applyTag($machine, 'maintenance-due');
        } else {
            $tagManager->removeTag($machine, 'maintenance-due');
        }
    }
}
