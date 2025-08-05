<?php

namespace App\Http\Controllers;

use App\Mail\PartRequestMail;
use App\Models\Ticket; // Import the new Mailable
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class PartRequestController extends Controller
{
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

        // Create a new ticket update to log that the request was sent
        $ticket->updates()->create([
            'user_id' => Auth::id(),
            'comment' => 'Sent a part request to: '.implode(', ', $validated['to']),
        ]);

        return back()->with('success', 'Part request sent successfully.');
    }
}
