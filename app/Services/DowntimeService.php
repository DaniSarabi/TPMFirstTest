<?php

namespace App\Services;

use App\Models\Machine;
use App\Models\DowntimeLog;
use App\Models\Ticket;
use App\Models\ScheduledMaintenance;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class DowntimeService
{
    public function __construct(protected TagManagerService $tagManager) {}

    /**
     * The centralized "Downtime Resolver".
     * It is the single source of truth for a machine's downtime state and ownership.
     */
    public function resolveDowntime(Machine $machine): void
    {
        DB::transaction(function () use ($machine) {
            $machine = Machine::where('id', $machine->id)->lockForUpdate()->first();

            // Find all potential downtime owners (for now, just critical tickets).
            $criticalTickets = Ticket::where('machine_id', $machine->id)
                ->where('priority', 2)
                ->whereDoesntHave('status.behaviors', function ($q) {
                    $q->whereIn('name', ['is_ticket_closing_status', 'is_ticket_discard_status']);
                })
                ->with('status.behaviors')
                ->orderBy('created_at', 'asc')
                ->get();

            // 2. Find critical maintenances (Priority 2)
            $criticalMaintenances = ScheduledMaintenance::whereIn('status', ['in_progress', 'in_progress_overdue'])
                ->where('is_critical', true)
                ->whereHasMorph(
                    'schedulable',
                    ['App\\Models\\Machine', 'App\\Models\\Subsystem'],
                    function ($query, $type) use ($machine) {
                        if ($type === 'App\\Models\\Machine') {
                            $query->where('id', $machine->id);
                        }
                        if ($type === 'App\\Models\\Subsystem') {
                            $query->where('machine_id', $machine->id);
                        }
                    }
                )
                ->orderBy('scheduled_date', 'asc')
                ->get();

            $winner = null;
            if ($criticalTickets->isNotEmpty()) {
                // Critical tickets always take priority.
                $winner = $criticalTickets->first();
            } elseif ($criticalMaintenances->isNotEmpty()) {
                // If no critical tickets, a critical maintenance can be the owner.
                $winner = $criticalMaintenances->first();
            }
            $currentLog = DowntimeLog::where('machine_id', $machine->id)->whereNull('end_time')->first();

            if ($winner) {
                $category = $this->_determineCategory($winner);

                if ($currentLog) {
                    // A log is already open. If the owner or reason has changed, start a new log.
                    if ($currentLog->downtimeable_id != $winner->id || $currentLog->downtimeable_type != get_class($winner) || $currentLog->category != $category) {
                        $currentLog->update(['end_time' => now()]);
                        $this->_startDowntimeLog($machine, $category, $winner);
                    }
                } else {
                    // No log is open, so we start a new one.
                    $this->_startDowntimeLog($machine, $category, $winner);
                }

                $machine->update(['status' => 'out_of_service']);
            } else {
                // No valid owners remain. The machine should be operational.
                if ($currentLog) {
                    $currentLog->update(['end_time' => now()]);
                }
                $machine->update(['status' => 'operational']);
                $this->tagManager->removeTag($machine, 'out-of-service', null);
            }
        });
    }

    /**
     * A dedicated method for explicitly starting a downtime log for a preventive maintenance.
     * Probably deprecated 
     */
    public function startPreventiveDowntime(Machine $machine, ScheduledMaintenance $maintenance): void
    {
        $this->_startDowntimeLog($machine, 'Preventive', $maintenance);
        $machine->update(['status' => 'out_of_service']);
    }

    /**
     * A dedicated method for stopping a downtime log related to a specific maintenance.
     */
    public function stopPreventiveDowntime(Machine $machine, ScheduledMaintenance $maintenance): void
    {
        DowntimeLog::where('downtimeable_id', $maintenance->id)
            ->where('downtimeable_type', get_class($maintenance))
            ->whereNull('end_time')
            ->update(['end_time' => now()]);

        // After stopping the specific maintenance downtime, we must re-evaluate the overall state.
        $this->resolveDowntime($machine);
    }

    /**
     * Determines the correct downtime category based on the owner's state.
     */
    private function _determineCategory(Model $owner): string
    {
        if ($owner instanceof Ticket) {
            $isAwaitingParts = $owner->status->behaviors->contains(
                fn($b) =>
                in_array($b->name, ['awaits_critical_parts', 'awaits_non_critical_parts'])
            );
            return $isAwaitingParts ? 'Awaiting Parts' : 'Corrective';
        }
        if ($owner instanceof ScheduledMaintenance) {
            return 'Preventive';
        }
        return 'Other';
    }

    /**
     * Creates a new downtime log entry.
     */
    private function _startDowntimeLog(Machine $machine, string $category, Model $source): void
    {
        DowntimeLog::create([
            'machine_id' => $machine->id,
            'category' => $category,
            'downtimeable_id' => $source->id,
            'downtimeable_type' => get_class($source),
            'start_time' => now(),
        ]);
    }
}
