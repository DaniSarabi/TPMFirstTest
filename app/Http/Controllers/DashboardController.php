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

        // --- 1. Pre-calcular todos los tickets cerrados y su duración ---
        // Hacemos esto una sola vez para no repetirlo 30 veces en el bucle.
        $closedTicketsWithDurations = $tickets->map(function ($ticket) {
            // Encuentra la última actualización que sea un estado de cierre
            $closingUpdate = $ticket->updates
                ->filter(fn($update) => $update->newStatus && $update->newStatus->behaviors->contains('name', 'is_ticket_closing_status'))
                ->sortByDesc('created_at')
                ->first();

            if (!$closingUpdate) return null; // El ticket no está cerrado

            $createdAt = new Carbon($ticket->created_at);
            $completedAt = new Carbon($closingUpdate->created_at);

            return [
                'closed_at' => $completedAt,
                'duration'  => $createdAt->diffInMinutes($completedAt), // Duración total en minutos
            ];
        })->filter(); // Quita los nulos (tickets aún abiertos)


        // --- 2. Iterar por cada día en el rango de 30 días ---
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i)->startOfDay();
            $dateEnd = now()->subDays($i)->endOfDay();

            // --- CÁLCULO DE UPTIME (Sin cambios) ---
            $totalMinutesInDay = 1440 * $machines->count();
            $downtimeMinutes = $this->calculateDowntimeMinutes($downtimeLogs, $date, $dateEnd);
            $uptimePercentage = $totalMinutesInDay > 0
                ? (($totalMinutesInDay - $downtimeMinutes) / $totalMinutesInDay) * 100
                : 100;

            // --- CÁLCULO DE MTBF (Sin cambios, usa fallas creadas) ---
            $failuresToday = $tickets->filter(fn($ticket) => (new Carbon($ticket->created_at))->between($date, $dateEnd));
            $failureCount = $failuresToday->count();
            $operationalMinutes = $totalMinutesInDay - $downtimeMinutes;
            $mtbf = $failureCount > 0 ? ($operationalMinutes / $failureCount) / 60 : 24; // en horas

            // --- NUEVO CÁLCULO DE MTTR (Media Móvil de 7 días) ---
            $rollingStartDate = $date->copy()->subDays(6); // Ventana de 7 días

            $ticketsInWindow = $closedTicketsWithDurations->filter(
                fn($t) => $t['closed_at']->between($rollingStartDate, $dateEnd)
            );

            $totalRepairMinutes = $ticketsInWindow->sum('duration');
            $closedCount = $ticketsInWindow->count();
            // Evita la división por cero y convierte minutos a horas
            $mttr = $closedCount > 0 ? ($totalRepairMinutes / $closedCount) / 60 : 0;

            $trends[] = [
                'date' => $date->format('Y-m-d'),
                'uptime' => round($uptimePercentage, 2),
                'mtbf' => round($mtbf, 2),
                'mttr' => round($mttr, 2),
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

        // Tickets Opened (Esta lógica se queda igual)
        $ticketsOpenedThisWeek = Ticket::whereBetween('created_at', [$startOfThisWeek, $endOfThisWeek])->count();
        $ticketsOpenedLastWeek = Ticket::whereBetween('created_at', [$startOfLastWeek, $endOfLastWeek])->count();

        // Tickets Closed (Esta lógica se queda igual)
        $ticketsClosedThisWeek = Ticket::whereHas('updates', function ($query) use ($startOfThisWeek, $endOfThisWeek) {
            $query->whereBetween('created_at', [$startOfThisWeek, $endOfThisWeek])
                ->whereHas('newStatus.behaviors', fn($b) => $b->where('name', 'is_ticket_closing_status'));
        })->distinct()->count();

        $ticketsClosedLastWeek = Ticket::whereHas('updates', function ($query) use ($startOfLastWeek, $endOfLastWeek) {
            $query->whereBetween('created_at', [$startOfLastWeek, $endOfLastWeek])
                ->whereHas('newStatus.behaviors', fn($b) => $b->where('name', 'is_ticket_closing_status'));
        })->distinct()->count();

        // --- 3. ¡NUEVA LÓGICA DE TASA DE CIERRE! ---
        // Para que la métrica sea justa, calculamos la tasa de cierre (burn-down rate)
        // (Tickets Cerrados / Tickets Creados)
        $rateThisWeek = ($ticketsOpenedThisWeek > 0)
            ? ($ticketsClosedThisWeek / $ticketsOpenedThisWeek) * 100
            : ($ticketsClosedThisWeek > 0 ? 100 : 0); // Si no se abrieron, pero se cerraron, es 100%

        $rateLastWeek = ($ticketsOpenedLastWeek > 0)
            ? ($ticketsClosedLastWeek / $ticketsOpenedLastWeek) * 100
            : ($ticketsClosedLastWeek > 0 ? 100 : 0);

        // Awaiting Parts (Esta lógica se queda igual)
        $standByBehaviorName = 'is_stand_by_status';

        // Cuenta los tickets que (whereHas) tienen un 'status'
        // que a su vez (whereHas) tiene un 'behavior'
        // con ese nombre específico.
        $standByTicketCount = Ticket::whereHas('status', function ($query) use ($standByBehaviorName) {
            $query->whereHas('behaviors', function ($subQuery) use ($standByBehaviorName) {
                $subQuery->where('name', $standByBehaviorName);
            });
        })->count();;

        return response()->json([
            'ticketsOpened' => [
                'current' => $ticketsOpenedThisWeek,
                'previous' => $ticketsOpenedLastWeek,
            ],
            // 4. DEVOLVEMOS LOS DATOS ANTIGUOS Y LOS NUEVOS
            'ticketsClosed' => [
                'current' => $ticketsClosedThisWeek,
                'previous' => $ticketsClosedLastWeek,
            ],
            'closureRate' => [
                'current' => $rateThisWeek,
                'previous' => $rateLastWeek,
            ],
            'awaitingParts' => $standByTicketCount,
        ]);
    }
}
