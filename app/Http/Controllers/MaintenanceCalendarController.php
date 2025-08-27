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
        // --- Use advanced polymorphic eager loading ---
        // This tells Laravel which relationships to load for each specific model type.
        $scheduledMaintenances = ScheduledMaintenance::with([
            'schedulable' => function ($morphTo) {
                $morphTo->morphWith([
                    Machine::class => ['tickets', 'statusLogs.machineStatus', 'subsystems'],
                    Subsystem::class => ['machine.tickets', 'machine.statusLogs.machineStatus'],
                ]);
            },
            'template'
        ])->get();


        $events = $scheduledMaintenances->map(function (ScheduledMaintenance $sm) use ($closingStatusIds) {
            $finalColor = $sm->color;
          

            $schedulable = $sm->schedulable;
            $isMachine = $sm->schedulable_type === 'App\\Models\\Machine';

            // --- Logic now uses the dynamic list of closing status IDs ---
            $openTicketsCount = $isMachine
                ? $schedulable->tickets->whereNotIn('ticket_status_id', $closingStatusIds)->count()
                : $schedulable->machine->tickets->whereNotIn('ticket_status_id', $closingStatusIds)->count();

            $subsystemCount = $isMachine ? $schedulable->subsystems->count() : null;

            $statusLogs = $isMachine ? $schedulable->statusLogs : $schedulable->machine->statusLogs;

            $lastOperationalLog = $statusLogs
                ->where('machineStatus.is_operational_default', true)
                ->sortByDesc('created_at')
                ->first();

            $uptime = $lastOperationalLog ? Carbon::parse($lastOperationalLog->created_at)->diffForHumans(null, true) : 'N/A';

            $lastMaintenance = $schedulable?->scheduledMaintenances()->where('status', 'completed')->latest('scheduled_date')->first();

            // dd($openTicketsCount);  
            return [
                'id' => (string) $sm->id,
                'title' => $sm->title,
                'start' => $sm->scheduled_date->toDateString(),
                'allDay' => true,
                'backgroundColor' => $finalColor,
                'borderColor' => $finalColor,
                'extendedProps' => [
                    'status' => $sm->status,
                    'schedulableName' => $schedulable?->name ?? 'N/A',
                    'schedulableType' => $schedulable ? class_basename($sm->schedulable_type) : 'N/A',
                    'series_id' => $sm->series_id,
                    'grace_period_days' => $sm->grace_period_days,
                    'machine_image_url' => $isMachine ? $schedulable->image_url : $schedulable->machine->image_url,
                    'subsystem_count' => $subsystemCount,
                    'open_tickets_count' => $openTicketsCount,
                    'last_maintenance_date' => $lastMaintenance?->scheduled_date->format('M d, Y'),
                    'current_uptime' => $uptime,
                    'report_id'=> $sm->report?->id,
                ],
            ];
        });

        $machines = Machine::with('subsystems')->orderBy('name')->get();
        $templates = MaintenanceTemplate::orderBy('name')->get();

        return Inertia::render('MaintenanceCalendar/Index', [
            'events' => $events,
            'machines' => $machines,
            'templates' => $templates,
        ]);
    }
}
