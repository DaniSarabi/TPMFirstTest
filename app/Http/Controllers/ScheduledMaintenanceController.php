<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use App\Models\ScheduledMaintenance;
use App\Models\Subsystem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;


class ScheduledMaintenanceController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'maintenance_template_id' => 'required|exists:maintenance_templates,id',
            'scheduled_date' => 'required|date',
            'grace_period_days' => 'required|integer|min:0',
            'reminder_days_before' => 'nullable|integer|min:0',
            'schedulable_type' => ['required', Rule::in(['machine', 'subsystem'])],
            'schedulable_id' => 'required|integer',
            'is_repeating' => 'required|boolean',
            'title' => 'required|string|max:255',
            'color' => 'nullable|string|max:7',
            'repeat_interval' => 'required_if:is_repeating,true|integer|min:1',
            'repeat_unit' => ['required_if:is_repeating,true', Rule::in(['days', 'weeks', 'months'])],
            'repeat_until' => [
                'required_if:is_repeating,true',
                'date',
                // This rule will only be applied if the 'is_repeating' input is true.
                Rule::when($request->input('is_repeating'), ['after_or_equal:scheduled_date']),
            ],
        ]);

        try {
            $modelClass = $validated['schedulable_type'] === 'machine' ? Machine::class : Subsystem::class;
            $schedulable = $modelClass::findOrFail($validated['schedulable_id']);

            $startDate = Carbon::parse($validated['scheduled_date'])->startOfDay();

            // This array contains ONLY the fields that exist in our database table.
            $sharedData = [
                'maintenance_template_id' => $validated['maintenance_template_id'],
                'grace_period_days' => $validated['grace_period_days'],
                'reminder_days_before' => $validated['reminder_days_before'],
                'title' => $validated['title'],
                'color' => $validated['color'],
            ];

            // For a single event, we now use the clean $sharedData array.
            if (!$validated['is_repeating']) {
                $schedulable->scheduledMaintenances()->create(array_merge($sharedData, ['scheduled_date' => $startDate]));
                return Redirect::route('maintenance-calendar.index')->with('success', 'Maintenance scheduled successfully.');
            }

            $seriesId = (string) Str::uuid();
            $sharedData['series_id'] = $seriesId; // Add it to our shared data


            // The repeating event logic was already correct.
            $endDate = Carbon::parse($validated['repeat_until'])->startOfDay();
            $currentDate = $startDate->copy();

            while ($currentDate->lte($endDate)) {
                $schedulable->scheduledMaintenances()->create(array_merge($sharedData, ['scheduled_date' => $currentDate]));

                match ($validated['repeat_unit']) {
                    'days' => $currentDate->addDays($validated['repeat_interval']),
                    'weeks' => $currentDate->addWeeks($validated['repeat_interval']),
                    'months' => $currentDate->addMonths($validated['repeat_interval']),
                };
            }
            return Redirect::route('maintenance-calendar.index')->with('success', 'Repeating maintenance scheduled successfully.');
        } catch (Exception $e) {
            Log::error('Failed to schedule maintenance: ' . $e->getMessage());

            // Redirect the user back with a friendly error message
            return Redirect::back()->with('error', 'Something went wrong while scheduling the maintenance. Please try again.');
        }
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ScheduledMaintenance $scheduledMaintenance)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'scheduled_date' => 'required|date',
            'color' => 'nullable|string|max:7',
            'update_scope' => ['required', Rule::in(['single', 'future'])],
        ]);

        $updateData = [
            'title' => $validated['title'],
            'scheduled_date' => $validated['scheduled_date'],
            'color' => $validated['color'],
        ];

        // If it's a single event or the user chose to update only this one
        if (!$scheduledMaintenance->series_id || $validated['update_scope'] === 'single') {
            $scheduledMaintenance->update($updateData);
            return Redirect::back()->with('success', 'Event updated successfully.');
        }

        // --- Logic for updating all future events in a series ---
        $futureEvents = ScheduledMaintenance::where('series_id', $scheduledMaintenance->series_id)
            ->where('scheduled_date', '>=', $scheduledMaintenance->scheduled_date)
            ->get();

        // Calculate the date difference
        $originalDate = $scheduledMaintenance->scheduled_date;
        $newDate = Carbon::parse($validated['scheduled_date']);
        $dateDiff = $originalDate->diffInDays($newDate, false); // Use false for signed difference

        foreach ($futureEvents as $event) {
            $event->update([
                'title' => $validated['title'],
                'color' => $validated['color'],
                'scheduled_date' => $event->scheduled_date->addDays($dateDiff),
            ]);
        }

        return Redirect::back()->with('success', 'Event and all future occurrences have been updated.');
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, ScheduledMaintenance $scheduledMaintenance)
    {
        $validated = $request->validate([
            'delete_scope' => ['required', Rule::in(['single', 'future'])],
        ]);

        // If it's a single event or the user chose to delete only this one
        if (!$scheduledMaintenance->series_id || $validated['delete_scope'] === 'single') {
            $scheduledMaintenance->delete();
            return Redirect::back()->with('success', 'Event deleted successfully.');
        }

        // --- Logic for deleting all future events in a series ---
        ScheduledMaintenance::where('series_id', $scheduledMaintenance->series_id)
            ->where('scheduled_date', '>=', $scheduledMaintenance->scheduled_date)
            ->delete();

        return Redirect::back()->with('success', 'Event and all future occurrences have been deleted.');
    }
}
