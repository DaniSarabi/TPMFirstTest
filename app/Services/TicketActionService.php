<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Models\User;
use App\Models\Machine;
use App\Models\MachineStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Events\TicketStatusChanged;

class TicketActionService
{
 /**
     * Defines the severity hierarchy for machine statuses.
     * Higher numbers are more severe. This prevents a less severe issue
     * from overriding a more critical machine status.
     */
    private const STATUS_HIERARCHY = [
        'New' => 0,
        'In Service' => 1,
        'Awaiting Parts - Running' => 2,
        'Needs Maintenance' => 3,
        'Awaiting Parts - Down' => 4,
        'Out of Service' => 5,
    ];

    /**
     * The main "Gatekeeper" method for updating a machine's status.
     * It will only update the status if the new status is of equal or greater severity.
     */
    public function updateMachineStatus(Machine $machine, int $newStatusId, User $user, ?Ticket $originatingTicket = null): void
    {
        $currentStatus = $machine->machineStatus;
        $newStatus = MachineStatus::findOrFail($newStatusId);

        $currentSeverity = self::STATUS_HIERARCHY[$currentStatus->name] ?? 0;
        $newSeverity = self::STATUS_HIERARCHY[$newStatus->name] ?? 0;

        // Only update if the new status is more severe or the same.
        if ($newSeverity >= $currentSeverity) {
            $machine->update(['machine_status_id' => $newStatus->id]);

            // If a ticket triggered this change, log it.
            if ($originatingTicket) {
                $originatingTicket->updates()->create([
                    'user_id' => $user->id,
                    'comment' => 'System: This action set the machine\'s status.',
                    'new_machine_status_id' => $newStatus->id,
                ]);
            }
        }
    }
  /**
     * The logic for when a ticket is closed. It checks for other open tickets
     * and determines the correct new status for the machine.
     */
    private function updateMachineStatusOnTicketClose(Machine $machine, User $user): void
    {
        $closingStatus = TicketStatus::whereHas('behaviors', fn ($q) => $q->where('name', 'is_ticket_closing_status'))->first();
        if (!$closingStatus) return;

        // 1. Check for any other open tickets with HIGH priority (sev 2)
        $hasOtherSev2Tickets = Ticket::where('machine_id', $machine->id)
            ->where('ticket_status_id', '!=', $closingStatus->id)
            ->where('priority', 2)
            ->exists();

        if ($hasOtherSev2Tickets) {
            // If so, the machine MUST remain "Out of Service"
            $outOfServiceStatus = MachineStatus::where('name', 'Out of Service')->first();
            if ($outOfServiceStatus) $machine->update(['machine_status_id' => $outOfServiceStatus->id]);
            return;
        }

        // 2. Else, check for any other open tickets with MEDIUM priority (sev 1)
        $hasOtherSev1Tickets = Ticket::where('machine_id', $machine->id)
            ->where('ticket_status_id', '!=', $closingStatus->id)
            ->where('priority', 1)
            ->exists();
        
        if ($hasOtherSev1Tickets) {
            // If so, the machine should be set to "Needs Maintenance"
            $needsMaintenanceStatus = MachineStatus::where('name', 'Needs Maintenance')->first();
            if ($needsMaintenanceStatus) $machine->update(['machine_status_id' => $needsMaintenanceStatus->id]);
            return;
        }

        // 3. Else (no other open tickets), set the machine back to the operational default
        $inServiceStatus = MachineStatus::where('is_operational_default', true)->first();
        if ($inServiceStatus) {
            $machine->update(['machine_status_id' => $inServiceStatus->id]);
        }
    }

    /**
     * The main entry point for changing a ticket's status.
     */
    public function changeStatus(Ticket $ticket, int $newStatusId, ?string $comment, User $user): void
    {
        DB::transaction(function () use ($ticket, $newStatusId, $comment, $user) {
            $oldStatus = $ticket->status;
            $newStatus = TicketStatus::with('behaviors')->findOrFail($newStatusId);

            $ticket->update(['ticket_status_id' => $newStatus->id]);

            $update = $ticket->updates()->create([
                'user_id' => $user->id,
                'comment' => $comment,
                'old_status_id' => $oldStatus->id,
                'new_status_id' => $newStatus->id,
            ]);

            event(new TicketStatusChanged($update));

            foreach ($newStatus->behaviors as $behavior) {
                $this->executeBehavior($ticket, $behavior, $user);
            }
        });
    }

    /**
     * A central place to call the correct method for each behavior.
     */
    private function executeBehavior(Ticket $ticket, $behavior, User $user): void
    {
        switch ($behavior->name) {
            case 'triggers_downtime_parts':
                // Downtime logic will go here
                break;
            case 'is_ticket_closing_status':
                $this->updateMachineStatusOnTicketClose($ticket->machine, $user);
                break;
            case 'sets_machine_status':
                $machineStatusId = $behavior->pivot->machine_status_id;
                if ($machineStatusId) {
                    $this->updateMachineStatus($ticket->machine, $machineStatusId, $user, $ticket);
                }
                break;
        }
    }
/**
     * Close a ticket and log the resolution details.
     */
    public function closeTicket(Ticket $ticket, string $actionTaken, ?string $partsUsed, User $user): void
    {
        DB::transaction(function () use ($ticket, $actionTaken, $partsUsed, $user) {
            // Find the "Resolved" status using its behavior
            $closingStatus = TicketStatus::whereHas('behaviors', function ($query) {
                $query->where('name', 'is_ticket_closing_status');
            })->firstOrFail();

            // 1. Create the final "Resolution" log entry
            $ticket->updates()->create([
                'user_id' => $user->id,
                'action_taken' => $actionTaken,
                'parts_used' => $partsUsed,
                'old_status_id' => $ticket->ticket_status_id,
                'new_status_id' => $closingStatus->id,
            ]);

            // 2. Update the ticket's main status
            $ticket->update(['ticket_status_id' => $closingStatus->id]);

            // 3. Check if we should put the machine back in service
            $this->attemptToPutMachineInService($ticket->machine);
        });
    }

    /**
     * Check for other open tickets and put the machine in service if none exist.
     */
    private function attemptToPutMachineInService(Machine $machine): void
    {
        $closingStatus = TicketStatus::whereHas('behaviors', function ($query) {
            $query->where('name', 'is_ticket_closing_status');
        })->first();

        if (!$closingStatus) return;

        $otherOpenTickets = Ticket::where('machine_id', $machine->id)
            ->where('ticket_status_id', '!=', $closingStatus->id)
            ->exists();

        if (!$otherOpenTickets) {
            $inServiceStatus = MachineStatus::where('is_operational_default', true)->first();
            if ($inServiceStatus) {
                $machine->update(['machine_status_id' => $inServiceStatus->id]);
            }
        }
    }
    /**
     * Placeholder for the logic to log machine downtime.
     */
    private function logDowntime(Ticket $ticket, string $reason): void
    {
        // In the future, this method will contain the logic to find an open
        // downtime log for the machine or create a new one.
        // For now, we can just log that it would happen.
        Log::info("Downtime log started for machine #{$ticket->machine_id} with reason: {$reason}");
    }
}
