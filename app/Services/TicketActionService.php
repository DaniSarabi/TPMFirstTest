<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TicketActionService
{
    /**
     * Change the status of a ticket and trigger any associated behaviors.
     *
     * @param  Ticket  $ticket  The ticket to update.
     * @param  int  $newStatusId  The ID of the new status.
     * @param  string|null  $comment  An optional comment for the update.
     * @param  User  $user  The user performing the action.
     */
    public function changeStatus(Ticket $ticket, int $newStatusId, ?string $comment, User $user): void
    {
        // We wrap the entire operation in a database transaction.
        // This ensures that if any part fails, all changes are rolled back.
        DB::transaction(function () use ($ticket, $newStatusId, $comment, $user) {
            $oldStatus = $ticket->status;
            $newStatus = TicketStatus::with('behaviors')->findOrFail($newStatusId);

            // 1. Update the ticket's main status
            $ticket->ticket_status_id = $newStatus->id;
            $ticket->save();

            // 2. Create a log entry for the change
            $ticket->updates()->create([
                'user_id' => $user->id,
                'comment' => $comment,
                'old_status_id' => $oldStatus->id,
                'new_status_id' => $newStatus->id,
            ]);

            // 3. Check for and execute any behaviors on the new status
            foreach ($newStatus->behaviors as $behavior) {
                $this->executeBehavior($ticket, $behavior->name);
            }
        });
    }

    /**
     * A central place to call the correct method for each behavior.
     */
    private function executeBehavior(Ticket $ticket, string $behaviorName): void
    {
        switch ($behaviorName) {
            case 'triggers_downtime_parts':
                $this->logDowntime($ticket, 'Awaiting Parts');
                break;
            case 'triggers_downtime_maintenance':
                $this->logDowntime($ticket, 'Maintenance');
                break;

                // We can add cases for other behaviors here in the future
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
