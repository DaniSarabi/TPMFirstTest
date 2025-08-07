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
        $validated = $request->validate([
            'to' => 'required|array|min:1',
            'to.*' => 'required|email',
            'cc' => 'nullable|string',
            'subject' => 'required|string',
            'body' => 'required|string',
        ]);

        $ccEmails = [];
        if (! empty($validated['cc'])) {
            // Split the string by commas and trim whitespace
            $ccEmails = array_map('trim', explode(',', $validated['cc']));
        }

        $mail = Mail::to($validated['to']);
        if (! empty($ccEmails)) {
            $mail->cc($ccEmails);
        }
        $mail->send(new PartRequestMail(
            $ticket,
            $request->user(),
            $validated['body']
        ));

        // Determine which machine status we're looking for based on priority.
        $targetMachineStatusName = $ticket->priority === 2 ? 'Awaiting Parts - Down' : 'Awaiting Parts - Running';
        $targetMachineStatus = MachineStatus::where('name', $targetMachineStatusName)->first();

        // Find the TicketStatus that has the 'triggers_downtime_parts' behavior AND
        // is configured to set the machine to our target status.
        $newStatus = null;
        if ($targetMachineStatus) {
            $newStatus = TicketStatus::whereHas('behaviors', function ($query) {
                $query->where('name', 'triggers_downtime_parts');
            })->whereHas('behaviors', function ($query) use ($targetMachineStatus) {
                $query->where('name', 'sets_machine_status')
                    ->where('ticket_status_has_behaviors.machine_status_id', $targetMachineStatus->id);
            })->first();
        }

        // Fallback to a simple name lookup if the behavior isn't configured
        if (!$newStatus) {
            $newStatusName = $ticket->priority === 2 ? 'Awaiting Critical Parts' : 'Awaiting Parts';
            $newStatus = TicketStatus::where('name', $newStatusName)->firstOrFail();
            return back()->with('error', 'Something went wrong');
        }

        // The service handles all the complex logic of updating the status,
        // logging the change, and triggering any behaviors.
        $this->ticketActionService->changeStatus(
            $ticket,
            $newStatus->id,
            "Sent a part request to: " . implode(', ', $validated['to']),
            $request->user()
        );

        // Create a new ticket update to log that the request was sent
        $ticket->updates()->create([
            'user_id' => Auth::id(),
            'comment' => 'Sent a part request to: ' . implode(', ', $validated['to']),
        ]);

        return back()->with('success', 'Part request sent successfully.');
    }
}
