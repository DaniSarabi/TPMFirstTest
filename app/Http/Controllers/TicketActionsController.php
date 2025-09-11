<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\TicketActionService;
use App\Models\Ticket;
use App\Models\TicketStatus;


class TicketActionsController extends Controller
{
    public function __construct(protected TicketActionService $ticketActionService) {}


    /**
     * --- ACTION: New method for escalating a ticket's priority ---
     * This method is protected by the 'tickets.escalate' permission via the routes file.
     */
    public function escalate(Request $request, Ticket $ticket)
    {
        // 1. Validate the incoming request for an optional comment.
        $validated = $request->validate([
            'comment' => 'nullable|string|max:1000',
        ]);

        // 2. Delegate the entire complex operation to our "Ticket Boss".
        $this->ticketActionService->escalateTicket(
            $ticket,
            $request->user(),
            $validated['comment']
        );

        return back()->with('success', 'Ticket escalated to High Priority.');
    }
    /**
     * ACTION: New method to downgrade a ticket.
     */
    public function downgrade(Request $request, Ticket $ticket)
    {
        $validated = $request->validate(['comment' => 'required|string']);

        $this->ticketActionService->downgradeTicket(
            $ticket,
            $request->user(),
            $validated['comment']
        );

        return back()->with('success', 'Ticket downgraded successfully.');
    }

    /**
     * ACTION: New method to discard a ticket.
     */
    public function discard(Request $request, Ticket $ticket)
    {
        $validated = $request->validate(['comment' => 'required|string']);

        $this->ticketActionService->discardTicket(
            $ticket,
            $request->user(),
            $validated['comment']
        );

        return back()->with('success', 'Ticket discarded successfully.');
    }

    /**
     * Change the ticket status to 'In Progress'.
     */
    public function startWork(Ticket $ticket)
    {
        // --- ACTION: Refactored to find the status by its behavior, not its name ---
        $inProgressStatus = TicketStatus::whereHas('behaviors', fn($q) => $q->where('name', 'is_in_progress_status'))->firstOrFail();

        $this->ticketActionService->changeStatus(
            $ticket,
            $inProgressStatus->id,
            'Work has started on this ticket.',
            Auth::user()
        );

        return back()->with('success', 'Work started on ticket.');
    }

    /**
     * Resume work on a ticket, changing its status back to 'In Progress'.
     */
    public function resumeWork(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'comment' => 'nullable|string',
        ]);

        // --- ACTION: Refactored to find the status by its behavior, not its name ---
        $inProgressStatus = TicketStatus::whereHas('behaviors', fn($q) => $q->where('name', 'is_in_progress_status'))->firstOrFail();
        $comment = $validated['comment'] ?? 'Work has resumed on this ticket.';

        $this->ticketActionService->changeStatus(
            $ticket,
            $inProgressStatus->id,
            $comment,
            $request->user()
        );

        return back()->with('success', 'Work resumed on ticket.');
    }
    /**
     * Close a ticket and log the resolution details.
     */
    public function close(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'action_taken' => 'required|string',
            'parts_used' => 'nullable|string',
            'category' => 'required|string', // New category field
            'photos' => 'nullable|array',      // New photos array
            'photos.*' => 'image|max:10240',   // 10MB max per photo
        ]);

        // Call the service to perform all the complex logic
        $this->ticketActionService->closeTicket(
            $ticket,
            $validated['action_taken'],
            $validated['parts_used'],
            $validated['category'],
            $request->file('photos'), // Pass the uploaded files to the service
            $request->user()
        );

        return back()->with('success', 'Ticket closed successfully.');
    }
}
