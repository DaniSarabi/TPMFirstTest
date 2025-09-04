<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use App\Models\MaintenanceTemplate;
use App\Models\ScheduledMaintenance;
use App\Models\TicketStatus;
use App\Models\Subsystem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class MaintenanceCalendarController extends Controller
{
    public function index(Request $request): Response
    {
        $closingStatusIds = TicketStatus::whereHas('behaviors', function ($query) {
            $query->where('name', 'is_ticket_closing_status');
        })->pluck('id');

        // --- ACTION: Update the eager-loading to use the new 'tags' and 'downtimeLogs' relationships ---
        $scheduledMaintenances = ScheduledMaintenance::with([
            'schedulable' => function ($morphTo) {
                $morphTo->morphWith([
                    // Instead of statusLogs, we now load tags and downtimeLogs
                    Machine::class => ['tickets', 'tags', 'downtimeLogs', 'subsystems'],
                    Subsystem::class => ['machine.tickets', 'machine.tags', 'machine.downtimeLogs', 'machine.subsystems'], // Added machine.subsystems
                ]);
            },
            'template',
            'report', // Also load the report relationship
        ])->get();


        $events = $scheduledMaintenances->map(function (ScheduledMaintenance $sm) use ($closingStatusIds) {
            $schedulable = $sm->schedulable;
            if (!$schedulable) {
                return null; // Skip if the schedulable item has been deleted
            }

            $isMachine = $sm->schedulable_type === 'App\\Models\\Machine';
            $machine = $isMachine ? $schedulable : $schedulable->machine;

            // --- ACTION: Refactored logic to use the new data structures ---
            $openTicketsCount = $machine->tickets->whereNotIn('ticket_status_id', $closingStatusIds)->count();
            $subsystemCount = $machine->subsystems->count();

            // --- ACTION: New, correct uptime calculation using the downtime_logs table ---
            $lastDowntime = $machine->downtimeLogs->whereNotNull('end_time')->sortByDesc('end_time')->first();
            $uptime = 'N/A';
            if ($lastDowntime) {
                $uptime = Carbon::parse($lastDowntime->end_time)->diffForHumans(null, true);
            } else {
                // Fallback: If there's no downtime, uptime is from the machine's creation date.
                $uptime = $machine->created_at->diffForHumans(null, true);
            }

            $lastMaintenance = $schedulable->scheduledMaintenances()->where('status', 'completed')->latest('scheduled_date')->first();

            return [
                'id' => (string) $sm->id,
                'title' => $sm->title,
                'start' => $sm->scheduled_date->toDateString(),
                'allDay' => true,
                'backgroundColor' => $sm->color,
                'borderColor' => $sm->color,
                'extendedProps' => [
                    'status' => $sm->status,
                    'schedulableName' => $schedulable->name,
                    'schedulableType' => class_basename($sm->schedulable_type),
                    'series_id' => $sm->series_id,
                    'grace_period_days' => $sm->grace_period_days,
                    'machine_image_url' => $machine->image_url,
                    'machine_status' => $machine->status, // Pass the new simple status string
                    'machine_tags' => $machine->tags,     // Pass the machine's current tags
                    'subsystem_count' => $subsystemCount,
                    'open_tickets_count' => $openTicketsCount,
                    'last_maintenance_date' => $lastMaintenance?->scheduled_date->format('M d, Y'),
                    'current_uptime' => $uptime,
                    'report_id' => $sm->report?->id,
                ],
            ];
        })->filter(); // Use filter() to remove any null entries from the map.

        $machines = Machine::with('subsystems')->orderBy('name')->get();
        $templates = MaintenanceTemplate::orderBy('name')->get();

        return Inertia::render('MaintenanceCalendar/Index', [
            'events' => $events->values(), // Use values() to re-index the array after filtering
            'machines' => $machines,
            'templates' => $templates,
        ]);
    }
}
