<?php

namespace App\Http\Controllers;

use App\Mail\PartRequestMail;
use App\Models\Ticket; // Import the new Mailable
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Services\TicketActionService;
use App\Models\MachineStatus;
use App\Models\TicketStatus;


class PartRequestController extends Controller
{
    public function __construct(protected TicketActionService $ticketActionService) {}
    /**
     * Send a part request email and log the update.
     */
    public function send(Request $request, Ticket $ticket)
    {
        // --- 1. Validation and Email Sending (This logic remains the same) ---
        $validated = $request->validate([
            'to' => 'required|array|min:1',
            'to.*' => 'required|email',
            'cc' => 'nullable|string',
            'subject' => 'required|string',
            'body' => 'required|string',
        ]);

        $ccEmails = [];
        if (!empty($validated['cc'])) {
            $ccEmails = array_map('trim', explode(',', $validated['cc']));
        }

        $mail = Mail::to($validated['to']);
        if (!empty($ccEmails)) {
            $mail->cc($ccEmails);
        }
        $mail->send(new PartRequestMail(
            $ticket,
            $request->user(),
            $validated['body']
        ));

        // --- 2. Find the Correct "Awaiting Parts" Status (The Refactored Logic) ---
        // We no longer use hard-coded names or old behaviors. We find the status
        // based on its new, specific behavior, driven by the ticket's priority.

        if ($ticket->priority === 2) { // High Priority
            $newStatus = TicketStatus::whereHas('behaviors', fn($q) => $q->where('name', 'awaits_critical_parts'))->firstOrFail();
        } else { // Medium or Low Priority
            $newStatus = TicketStatus::whereHas('behaviors', fn($q) => $q->where('name', 'awaits_non_critical_parts'))->firstOrFail();
        }

        // --- 3. Delegate to the TicketActionService ---
        // The service will handle all the complex logic of updating the status,
        // creating the timeline entry, and telling the TagManagerService what happened.
        $this->ticketActionService->changeStatus(
            $ticket,
            $newStatus->id,
            "Sent a part request to: " . implode(', ', $validated['to']),
            $request->user()
        );
        
        // --- The old, redundant ticket->updates()->create() call has been removed. ---

        return back()->with('success', 'Part request sent successfully.');
    }
}
