<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Models\TicketUpdate;
use Illuminate\Support\Facades\Auth;
use App\Services\TicketActionService;


class TicketUpdateController extends Controller
{
    //Inject the service to the Controller
    public function __construct(protected TicketActionService $ticketActionService)
    {
    }
    /**
     * Store a new update (comment) for a ticket.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Ticket  $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'comment' => 'required|string',
        ]);

        // Create a new ticket update associated with the ticket and the current user
        $ticket->updates()->create([
            'user_id' => Auth::id(),
            'comment' => $validated['comment'],
        ]);

        // Redirect back to the ticket page. Inertia will automatically refresh the props.
        return back()->with('success', 'Comment posted successfully.');
    }

    /**
     * Update the status of a ticket.
     */
    public function updateStatus(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'new_status_id' => 'required|exists:ticket_statuses,id',
            'comment' => 'nullable|string',
        ]);

        $this->ticketActionService->changeStatus(
            $ticket,
            $validated['new_status_id'],
            $validated['comment'],
            $request->user()
        );

        return back()->with('success', 'Ticket status updated successfully.');
    }
}
