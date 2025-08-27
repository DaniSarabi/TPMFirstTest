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
            'template.tasks',
            'schedulable'
        ]);

        // Pass the main scheduledMaintenance object to the view
        return Inertia::render('PerformMaintenance/Index', [
            'scheduledMaintenance' => $scheduledMaintenance,
        ]);
    }
    /**
     * Save the current progress of a maintenance report.
     */
    public function saveProgress(Request $request, ScheduledMaintenance $scheduledMaintenance)
    {
        // Very lenient validation. We just check that the data is in the right format.
        $validated = $request->validate([
            'results' => 'present|array',
            'results.*.task_label' => 'string',
            'results.*.result' => 'nullable',
            'results.*.comment' => 'nullable|string',
            'results.*.photos' => 'nullable|array',
            'results.*.photos.*' => 'image|max:10240',
            'notes' => 'nullable|string',
        ]);

        if ($scheduledMaintenance->status === 'scheduled' || $scheduledMaintenance->status === 'overdue') {
            $newStatus = $scheduledMaintenance->status === 'overdue'
                ? 'in_progress_overdue'
                : 'in_progress';
            $scheduledMaintenance->update(['status' => $newStatus]);
        }

        $this->updateReportData($request, $scheduledMaintenance, $validated);

        return Redirect::back()->with('success', 'Progress saved successfully.');
    }

    /**
     * Submit the final maintenance report.
     */
    public function submitReport(Request $request, ScheduledMaintenance $scheduledMaintenance)
    {
        $templateTasks = $scheduledMaintenance->template->tasks->keyBy('label');
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

                $isMandatory = $task->options['is_mandatory'] ?? false;
                $photoRequired = $task->options['photo_required'] ?? false;

                // 1. Check for a result on mandatory tasks
                if ($isMandatory && is_null($resultData['result'])) {
                    $validator->errors()->add("results.{$index}.result", "A result is required for this mandatory task.");
                }

                // 2. Check for a photo on mandatory, photo-required tasks
                if ($isMandatory && $photoRequired) {
                    // FIX: Check for both newly uploaded files and existing saved photos.
                    $hasNewPhoto = $request->hasFile("results.{$index}.photos");
                    $reportResult = $scheduledMaintenance->report->results()->where('task_label', $taskLabel)->first();
                    $hasExistingPhotos = $reportResult && $reportResult->photos()->count() > 0;

                    if (!$hasNewPhoto && !$hasExistingPhotos) {
                        $validator->errors()->add("results.{$index}.result", "A photo is required for this mandatory task.");
                    }
                }
            }
        });

        // If validation fails, redirect back with the errors AND the user's input.
        if ($validator->fails()) {
            return Redirect::back()->withErrors($validator)->withInput();
        }

        // If validation passes, proceed with saving
        $validated = $validator->validated();
        $report = $this->updateReportData($request, $scheduledMaintenance, $validated);

        $isOverdue = in_array($scheduledMaintenance->status, ['overdue', 'in_progress_overdue']);

        $finalStatus = $isOverdue
            ? 'completed_overdue'
            : 'completed';

        $report->update(['completed_at' => now()]);
        $scheduledMaintenance->update(['status' => $finalStatus]);

        return Redirect::route('maintenance-calendar.index')->with('success', 'Maintenance report submitted successfullyy.');
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
}
