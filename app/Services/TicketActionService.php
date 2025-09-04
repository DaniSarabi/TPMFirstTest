<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Models\User;
use App\Models\Machine;
use App\Models\Tag;
use Illuminate\Support\Facades\DB;

class TicketActionService
{
    /**
     * Inject the new TagManagerService.
     */
    public function __construct(protected TagManagerService $tagManager) {}

    /**
     * The main entry point for changing a ticket's status.
     * This method is now much simpler.
     */
    public function changeStatus(Ticket $ticket, int $newStatusId, ?string $comment, User $user): void
    {
        DB::transaction(function () use ($ticket, $newStatusId, $comment, $user) {
            $oldStatus = $ticket->status;
            $newStatus = TicketStatus::with('behaviors')->findOrFail($newStatusId);

            // Before we change the status, we check the OLD status's behaviors.
            $oldStatusWasAwaitingParts = $oldStatus->behaviors->contains(fn($b) => 
                in_array($b->name, ['awaits_critical_parts', 'awaits_non_critical_parts'])
            );
            
            // If the old status was an "Awaiting Parts" status, we must remove the tag.
            if ($oldStatusWasAwaitingParts) {
                $this->tagManager->removeTag($ticket->machine, 'awaiting-parts', $ticket);
            }


            // Update the ticket's status and create a log entry (this is still its job).
            $ticket->update(['ticket_status_id' => $newStatus->id]);
            $ticket->updates()->create([
                'user_id' => $user->id,
                'comment' => $comment,
                'old_status_id' => $oldStatus->id,
                'new_status_id' => $newStatus->id,
            ]);

            // Execute behaviors by delegating to the TagManagerService.
            foreach ($newStatus->behaviors as $behavior) {
                if ($behavior->name === 'applies_machine_tag') {
                    $tagId = $behavior->pivot->tag_id;
                    $tag = Tag::find($tagId);
                    if ($tag) {
                        $this->tagManager->applyTag($ticket->machine, $tag->slug, $ticket);
                    }
                }
            }

            // All old, complex downtime logic has been removed from this method.
        });
    }
    /**
     * Close a ticket and log the resolution details.
     */
    public function closeTicket(Ticket $ticket, string $actionTaken, ?string $partsUsed, User $user): void
    {
        DB::transaction(function () use ($ticket, $actionTaken, $partsUsed, $user) {
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

            // 3. Check if this was the last open ticket and remove the 'open-ticket' tag if so.
            $this->syncMachineTagsOnTicketClose($ticket->machine, $ticket);
        });
    }

    /**
     * ACTION: This new private method contains all the logic for what happens
     * when a ticket is closed, keeping the public methods clean.
     */
    private function syncMachineTagsOnTicketClose(Machine $machine, Ticket $closedTicket): void
    {
        $closingStatus = TicketStatus::whereHas('behaviors', fn($q) => $q->where('name', 'is_ticket_closing_status'))->first();
        if (!$closingStatus) return;

        // We only care about other HIGH priority tickets.
        $hasOtherCriticalTickets = Ticket::where('machine_id', $machine->id)
            ->where('id', '!=', $closedTicket->id)
            ->where('priority', 2) // Priority 2 is High
            ->where('ticket_status_id', '!=', $closingStatus->id)
            ->exists();
        
        // If there are no other critical tickets, it's safe to remove the out-of-service tag.
        if (!$hasOtherCriticalTickets) {
            $this->tagManager->removeTag($machine, 'out-of-service', $closedTicket);
        }

        // Next, check if there are ANY other open tickets for this machine.
        $hasOtherOpenTickets = Ticket::where('machine_id', $machine->id)
            ->where('id', '!=', $closedTicket->id)
            ->where('ticket_status_id', '!=', $closingStatus->id)
            ->exists();

        // If there are no other open tickets at all, remove the generic 'open-ticket' tag.
        if (!$hasOtherOpenTickets) {
            $this->tagManager->removeTag($machine, 'open-ticket', $closedTicket);
        }
    }
}
