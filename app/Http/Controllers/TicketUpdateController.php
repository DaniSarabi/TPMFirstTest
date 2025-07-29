<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Models\TicketUpdate;
use Illuminate\Support\Facades\Auth;


class TicketUpdateController extends Controller
{

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
}
