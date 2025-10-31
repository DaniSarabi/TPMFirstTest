<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Models\User;
use App\Models\Machine;
use App\Models\Tag;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TicketActionService
{
    /**
     * Inject the TagManagerService so we can use it.
     */
    public function __construct(protected TagManagerService $tagManager, protected DowntimeService $downtimeService) {}

    /**
     * The main entry point for changing a ticket's status.
     */
    public function changeStatus(Ticket $ticket, int $newStatusId, ?string $comment, User $user): void
    {
        DB::transaction(function () use ($ticket, $newStatusId, $comment, $user) {
            $oldStatus = $ticket->status->load('behaviors');
            $newStatus = TicketStatus::with('behaviors')->findOrFail($newStatusId);

            // Update ticket status
            $ticket->update(['ticket_status_id' => $newStatus->id]);

            $ticket->updates()->create([
                'user_id' => $user->id,
                'comment' => $comment,
                'old_status_id' => $oldStatus->id,
                'new_status_id' => $newStatus->id,
            ]);

            // Apply tags from NEW status
            foreach ($newStatus->behaviors as $behavior) {
                $tagId = $behavior->pivot->tag_id;
                $tag = $tagId ? Tag::find($tagId) : null;
                if ($behavior->name === 'applies_machine_tag' && $tag) {
                    $this->tagManager->applyTag($ticket->machine, $tag->slug, $ticket);
                }
            }

            // Remove tags from OLD status (if safe to do so)
            foreach ($oldStatus->behaviors as $behavior) {
                $tagId = $behavior->pivot->tag_id;
                $tag = $tagId ? Tag::find($tagId) : null;
                if ($behavior->name === 'applies_machine_tag' && $tag) {
                    $this->_removeTagIfSafe($ticket->machine, $tag->slug, $oldStatus->id, $ticket);
                }
            }

            $this->_areOpenTicketsRemaining($ticket);

            if ($this->_changeRequiresDowntimeReevaluation($ticket, $oldStatus, $newStatus)) {
                $this->downtimeService->resolveDowntime($ticket->machine);
            }
        });
    }

    /**
     * Escalates a ticket's priority.
     */
    public function escalateTicket(Ticket $ticket, User $user, ?string $comment): void
    {
        if ($ticket->priority >= 2) {
            throw ValidationException::withMessages(['priority' => 'This ticket is already at the highest priority.']);
        }

        DB::transaction(function () use ($ticket, $user, $comment) {
            $ticket->update(['priority' => 2]);
            $ticket->updates()->create([
                'user_id' => $user->id,
                'comment' => $comment ?? 'Ticket priority escalated to High.',
                'action' => 'escalated',
            ]);

            // Escalating always affects downtime, so we call the resolver directly.
            $this->downtimeService->resolveDowntime($ticket->machine);
        });
    }

    /**
     * Downgrades a ticket's priority.
     */
    public function downgradeTicket(Ticket $ticket, User $user, string $comment): void
    {
        if ($ticket->priority < 2) {
            throw ValidationException::withMessages(['priority' => 'This ticket is not a high priority ticket.']);
        }

        DB::transaction(function () use ($ticket, $user, $comment) {
            $ticket->update(['priority' => 1]);
            $ticket->updates()->create([
                'user_id' => $user->id,
                'comment' => $comment,
                'action' => 'downgraded',
            ]);

            // Downgrading always affects downtime, so we call the resolver directly.
            $this->downtimeService->resolveDowntime($ticket->machine);
        });
    }

    /**
     * Discards a ticket.
     */
    public function discardTicket(Ticket $ticket, User $user, string $comment): void
    {
        DB::transaction(function () use ($ticket, $user, $comment) {
            $discardStatus = TicketStatus::whereHas('behaviors', fn($q) => $q->where('name', 'is_ticket_discard_status'))->firstOrFail();
            $this->changeStatus($ticket, $discardStatus->id, $comment, $user);
        });
    }

    /**
     * Close a ticket and log the resolution details.
     */
    public function closeTicket(Ticket $ticket, string $actionTaken, ?string $partsUsed, string $category, ?array $photos, User $user): void
    {
        DB::transaction(function () use ($ticket, $actionTaken, $partsUsed, $category, $photos, $user) {
            $closingStatus = TicketStatus::whereHas('behaviors', function ($query) {
                $query->where('name', 'is_ticket_closing_status');
            })->firstOrFail();

            // 1. Create the final "Resolution" log entry, now including the category.
            $update = $ticket->updates()->create([
                'user_id' => $user->id,
                'action_taken' => $actionTaken,
                'parts_used' => $partsUsed,
                'category' => $category, // The new category is saved here.
                'old_status_id' => $ticket->ticket_status_id,
                'new_status_id' => $closingStatus->id,
            ]);

            // 2. Handle the photo uploads.
            if ($photos) {
                foreach ($photos as $photo) {
                    // Store the photo in 'storage/app/public/solution_photos'
                    $path = $photo->store('solution_photos', 'public');
                    // Create a new record in our dedicated photos table.
                    $update->photos()->create(['photo_url' => $path]);
                }
            }

            // 3. Update the ticket's main status.
            $ticket->update(['ticket_status_id' => $closingStatus->id]);

            // Closing a ticket always affects downtime, so we call the resolver directly.
            $this->downtimeService->resolveDowntime($ticket->machine);
            $this->_areOpenTicketsRemaining($ticket);
        });
    }

    /**
     * ACTION: This new private helper contains the performance optimization logic.
     * It decides if a status change is "significant" enough to warrant
     * locking the machine table and re-evaluating the downtime state.
     */
    private function _changeRequiresDowntimeReevaluation(?Ticket $ticket, TicketStatus $oldStatus, TicketStatus $newStatus): bool
    {
        // If the priority is not high, status changes are less likely to affect downtime.
        // The exception is moving into or out of an "Awaiting Parts" state.
        if ($ticket && $ticket->priority < 2) {
            $awaitingPartsBehaviors = ['awaits_critical_parts', 'awaits_non_critical_parts'];
            $wasAwaitingParts = $oldStatus->behaviors->whereIn('name', $awaitingPartsBehaviors)->isNotEmpty();
            $isNowAwaitingParts = $newStatus->behaviors->whereIn('name', $awaitingPartsBehaviors)->isNotEmpty();

            // Only re-evaluate if we are moving into or out of an "Awaiting Parts" state.
            return $wasAwaitingParts !== $isNowAwaitingParts;
        }

        // For high-priority tickets, or for any action that moves a ticket to a final state,
        // it's always safest to re-evaluate.
        return true;
    }

    private function _areOpenTicketsRemaining(Ticket $ticket): void
    {
        $machine = $ticket->machine;
        $finalStatusBehaviors = ['is_ticket_closing_status', 'is_ticket_discard_status'];

        // Check 1: Should the 'open-ticket' tag be removed?
        $hasAnyOtherOpenTickets = Ticket::where('machine_id', $machine->id)
            ->whereDoesntHave('status.behaviors', function ($q) use ($finalStatusBehaviors) {
                $q->whereIn('name', $finalStatusBehaviors);
            })
            ->exists();

        if (!$hasAnyOtherOpenTickets) {
            $this->tagManager->removeTag($machine, 'open-ticket', $ticket);
        }

        // Step 2: Always ask the resolver to check the downtime state.
        $this->downtimeService->resolveDowntime($machine);
    }
    /**
     * Remove a tag from the machine only if no other active ticket has that status.
     */
    private function _removeTagIfSafe(Machine $machine, string $tagSlug, int $oldStatusId, Ticket $currentTicket): void
    {
        // Check if any OTHER active ticket on this machine has the same old status
        $otherTicketsWithSameStatus = Ticket::where('machine_id', $machine->id)
            ->where('id', '!=', $currentTicket->id)
            ->where('ticket_status_id', $oldStatusId)
            ->whereDoesntHave(
                'status.behaviors',
                fn($q) =>
                $q->whereIn('name', ['is_ticket_closing_status', 'is_ticket_discard_status'])
            )
            ->exists();

        // Only remove if no other ticket has that status
        if (!$otherTicketsWithSameStatus) {
            $this->tagManager->removeTag($machine, $tagSlug, $currentTicket);
        }
    }
}
