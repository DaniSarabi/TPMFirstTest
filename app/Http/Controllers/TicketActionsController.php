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
        ]);

        // Call the service to perform all the complex logic
        $this->ticketActionService->closeTicket(
            $ticket,
            $validated['action_taken'],
            $validated['parts_used'],
            $request->user()
        );

        return back()->with('success', 'Ticket closed successfully.');
    }
}
