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

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $machines = Machine::orderBy('name')->get(['id', 'name']);

        $scheduledMaintenances = ScheduledMaintenance::with([
            'report:id,scheduled_maintenance_id,completed_at',
            'report.results:id,maintenance_report_id,task_label,result',
            'template.sections.tasks',
            'template.tasks'
        ])
            ->whereYear('scheduled_date', now()->year)
            ->get([
                'id',
                'schedulable_id',
                'schedulable_type',
                'scheduled_date',
                'status',
                'maintenance_template_id'
            ]);

        $todayDowntimeLogs = DowntimeLog::whereDate('start_time', '<=', now())
            ->where(function ($query) {
                $query->whereNull('end_time')
                    ->orWhereDate('end_time', '>=', now()->startOfDay());
            })
            ->get(['id', 'machine_id', 'category', 'start_time', 'end_time']);

        return Inertia::render('Dashboard/Index', [
            'machines' => $machines,
            'scheduledMaintenances' => $scheduledMaintenances,
            'todayDowntimeLogs' => $todayDowntimeLogs,
        ]);
    }

    public function getDowntimeData(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $logs = DowntimeLog::where(function ($query) use ($validated) {
            $query->whereBetween('start_time', [$validated['start_date'], $validated['end_date']])
                ->orWhereBetween('end_time', [$validated['start_date'], $validated['end_date']]);
        })
            ->orWhere(function ($query) use ($validated) {
                $query->where('start_time', '<', $validated['start_date'])
                    ->where('end_time', '>', $validated['end_date']);
            })
            ->get();

        return response()->json($logs);
    }

    public function getPerformanceTrends(): JsonResponse
    {
        $startDate = now()->subDays(30)->startOfDay();
        $endDate = now()->endOfDay();

        $machines = Machine::all();

        // Downtime logs are ONLY created by critical tickets (priority=2)
        $downtimeLogs = DowntimeLog::where(function ($query) use ($startDate, $endDate) {
            $query->whereBetween('start_time', [$startDate, $endDate])
                ->orWhere(function ($subQuery) use ($startDate) {
                    $subQuery->where('start_time', '<', $startDate)
                        ->where('end_time', '>', $startDate);
                });
        })->get();

        $allTickets = Ticket::with(['status.behaviors', 'updates.newStatus.behaviors'])
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('created_at', [$startDate, $endDate])
                    ->orWhere(function ($q) use ($startDate) {
                        $q->where('created_at', '<', $startDate)
                            ->whereHas('updates', function ($updateQuery) use ($startDate) {
                                $updateQuery->where('created_at', '>=', $startDate);
                            });
                    });
            })
            ->get();

        $criticalTickets = $allTickets->where('priority', 2);

        $trendsAll = $this->calculateTrendsForTickets($allTickets, $downtimeLogs, $machines);
        $trendsCritical = $this->calculateTrendsForTickets($criticalTickets, $downtimeLogs, $machines);

        return response()->json([
            'all' => $trendsAll,
            'critical' => $trendsCritical,
        ]);
    }

    private function calculateTrendsForTickets($tickets, $downtimeLogs, $machines)
    {
        $trends = [];

        $closedTicketsWithDurations = $tickets->map(function ($ticket) {
            $finalUpdate = $ticket->updates
                ->sortByDesc('created_at')
                ->first(function ($update) {
                    if (!$update->newStatus) return false;

                    $isClosing = $update->newStatus->behaviors->contains('name', 'is_ticket_closing_status');
                    $isDiscard = $update->newStatus->behaviors->contains('name', 'is_ticket_discard_status');

                    return $isClosing && !$isDiscard;
                });

            if (!$finalUpdate) return null;

            return [
                'closed_at' => new Carbon($finalUpdate->created_at),
                'duration' => (new Carbon($ticket->created_at))->diffInMinutes(new Carbon($finalUpdate->created_at)),
            ];
        })->filter();

        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i)->startOfDay();
            $dateEnd = now()->subDays($i)->endOfDay();

            $totalMinutesInDay = 1440 * $machines->count();
            $downtimeMinutes = $this->calculateDowntimeMinutes($downtimeLogs, $date, $dateEnd);
            $uptimePercentage = $totalMinutesInDay > 0
                ? (($totalMinutesInDay - $downtimeMinutes) / $totalMinutesInDay) * 100
                : 100;

            $failuresToday = $tickets->filter(fn($ticket) => (new Carbon($ticket->created_at))->between($date, $dateEnd));
            $failureCount = $failuresToday->count();
            $operationalMinutes = $totalMinutesInDay - $downtimeMinutes;

            $mtbfMinutes = $failureCount > 0
                ? $operationalMinutes / $failureCount
                : $operationalMinutes;

            $mtbf = $this->formatTimeValue($mtbfMinutes);

            $rollingStartDate = $date->copy()->subDays(6);
            $ticketsInWindow = $closedTicketsWithDurations->filter(
                fn($t) => $t['closed_at']->between($rollingStartDate, $dateEnd)
            );

            $totalRepairMinutes = $ticketsInWindow->sum('duration');
            $closedCount = $ticketsInWindow->count();
            $mttrMinutes = $closedCount > 0 ? $totalRepairMinutes / $closedCount : 0;

            $mttr = $this->formatTimeValue($mttrMinutes);

            $trends[] = [
                'date' => $date->format('Y-m-d'),
                'uptime' => round($uptimePercentage, 2),
                'mtbf' => $mtbf,
                'mttr' => $mttr,
            ];
        }

        return [
            'uptime' => array_map(fn($t) => ['date' => $t['date'], 'value' => $t['uptime']], $trends),
            'mtbf' => array_map(fn($t) => ['date' => $t['date'], 'value' => $t['mtbf']], $trends),
            'mttr' => array_map(fn($t) => ['date' => $t['date'], 'value' => $t['mttr']], $trends),
        ];
    }

    private function calculateDowntimeMinutes($downtimeLogs, $date, $dateEnd)
    {
        return $downtimeLogs->sum(function ($log) use ($date, $dateEnd) {
            $start = max(new \DateTime($log->start_time), $date);
            $end = $log->end_time
                ? min(new \DateTime($log->end_time), $dateEnd)
                : $dateEnd;

            if ($start >= $end) {
                return 0;
            }

            $diff = $start->diff($end);
            return $diff->i + ($diff->h * 60) + ($diff->days * 1440);
        });
    }

    private function formatTimeValue($minutes)
    {
        $hours = $minutes / 60;

        if ($hours >= 24) {
            return round($hours / 24, 2);
        }

        return round($hours, 2);
    }
    public function getMonthlyProgressTrend(): JsonResponse
    {
        $today = today();
        $oneMonthAgo = today()->subMonth();

        $currentSnapshot = MaintenanceProgressSnapshot::where('date', $today)->first();
        $previousSnapshot = MaintenanceProgressSnapshot::where('date', $oneMonthAgo)->first();

        return response()->json([
            'current' => $currentSnapshot,
            'previous' => $previousSnapshot,
        ]);
    }
    public function getThisWeekGlance(): JsonResponse
    {
        $now = now();
        $startOfThisWeek = $now->copy()->startOfWeek();
        $endOfThisWeek = $now->copy()->endOfWeek();

        $startOfLastWeek = $now->copy()->subWeek()->startOfWeek();
        $endOfLastWeek = $now->copy()->subWeek()->endOfWeek();

        // Tickets Opened
        $ticketsOpenedThisWeek = Ticket::whereBetween('created_at', [$startOfThisWeek, $endOfThisWeek])->count();
        $ticketsOpenedLastWeek = Ticket::whereBetween('created_at', [$startOfLastWeek, $endOfLastWeek])->count();

        // Tickets Closed (with closing status behavior)
        $ticketsClosedThisWeek = Ticket::whereHas('updates', function ($query) use ($startOfThisWeek, $endOfThisWeek) {
            $query->whereBetween('created_at', [$startOfThisWeek, $endOfThisWeek])
                ->whereHas('newStatus.behaviors', fn($b) => $b->where('name', 'is_ticket_closing_status'));
        })->distinct()->count();

        $ticketsClosedLastWeek = Ticket::whereHas('updates', function ($query) use ($startOfLastWeek, $endOfLastWeek) {
            $query->whereBetween('created_at', [$startOfLastWeek, $endOfLastWeek])
                ->whereHas('newStatus.behaviors', fn($b) => $b->where('name', 'is_ticket_closing_status'));
        })->distinct()->count();

        // Awaiting Parts (current status)
        $awaitingPartsCount = Ticket::whereHas('status.behaviors', function ($query) {
            $query->whereIn('name', ['awaits_critical_parts', 'awaits_non_critical_parts']);
        })->count();

        return response()->json([
            'ticketsOpened' => [
                'current' => $ticketsOpenedThisWeek,
                'previous' => $ticketsOpenedLastWeek,
            ],
            'ticketsClosed' => [
                'current' => $ticketsClosedThisWeek,
                'previous' => $ticketsClosedLastWeek,
            ],
            'awaitingParts' => $awaitingPartsCount,
        ]);
    }
}
