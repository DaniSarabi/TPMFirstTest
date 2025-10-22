<?php

namespace App\Listeners;

use App\Events\TicketCreated;
use App\Models\User;
use App\Mail\NewTicketNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendNewTicketEmailNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     *
     * @param  \App\Events\TicketCreated  $event
     * @return void
     */
    public function handle(TicketCreated $event)
    {
        $ticket = $event->ticket;
        $machine = $ticket->machine;

        if (!$machine) {
            Log::warning("Ticket #{$ticket->id} has no associated machine, cannot send email notifications.");
            return;
        }

        // --- ESTA ES LA LÓGICA CLAVE (ADAPTADA DE TU handleReminders) ---
        // Busca usuarios que quieran notificaciones de 'ticket.created'
        $usersToNotify = User::whereHas('notificationPreferences', function ($query) use ($machine) {
            $query->where('notification_type', 'ticket.created')
                ->where(function ($q) use ($machine) {
                    // Caso 1: Suscritos a TODAS las notificaciones de este tipo (preferable_id es null)
                    $q->whereNull('preferable_id');
                    // Caso 2: O, suscritos específicamente a esta máquina
                    $q->orWhere(function ($q2) use ($machine) {
                        $q2->where('preferable_id', $machine->id)
                            ->where('preferable_type', 'App\\Models\\Machine');
                    });
                });
        })->get();

        if ($usersToNotify->isEmpty()) {
            Log::info("No users subscribed to 'ticket.created' notifications for machine #{$machine->id}.");
            return;
        }

        foreach ($usersToNotify as $user) {
            Log::info("Sending 'New Ticket' email to {$user->email} for ticket #{$ticket->id}.");
            Mail::to($user->email)->send(new NewTicketNotification($ticket));
        }
    }
}
