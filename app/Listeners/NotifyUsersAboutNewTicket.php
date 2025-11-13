<?php

namespace App\Listeners;

use App\Events\TicketCreated;
use App\Models\User;
use App\Notifications\NewTicketNotification; // 1. Importamos la "Carta"
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

class NotifyUsersAboutNewTicket implements ShouldQueue
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
        Log::info('🚀 NotifyUsersAboutNewTicket fired for ticket #' . $event->ticket->id);

        $ticket = $event->ticket;
        $machine = $ticket->machine;

        if (!$machine) {
            Log::warning("Ticket #{$ticket->id} (sin máquina) no puede disparar notificaciones.");
            return;
        }

        // 2. Buscamos a TODOS los usuarios que estén suscritos a CUALQUIER canal
        // relacionado con la creación de tickets.
        $usersToNotify = User::whereHas('notificationPreferences', function ($query) use ($machine) {
            $query->where(function ($q) use ($machine) {
                $q->where('notification_type', 'ticket.created.in_app')
                    ->orWhere('notification_type', 'ticket.created.email')
                    ->orWhere('notification_type', 'ticket.created.teams');
            })
                ->where(function ($q) use ($machine) {
                    // Que aplique Global O para esta máquina específica
                    $q->whereNull('preferable_id')
                        ->orWhere(function ($q2) use ($machine) {
                            $q2->where('preferable_id', $machine->id)
                                ->where('preferable_type', 'App\\Models\\Machine');
                        });
                });
        })->get();

        if ($usersToNotify->isEmpty()) {
            Log::info("No users subscribed to any 'ticket.created' channel for machine #{$machine->id}.");
            return;
        }

        Log::info("Found {$usersToNotify->count()} users to notify about new ticket #{$ticket->id}.");

        // 3. ¡La Magia! Laravel se encarga del resto.
        // Llamará a la "aduana" (Paso 5) en el modelo User POR CADA usuario
        // y enviará la "Carta" (NewTicketNotification) solo por los canales correctos.
        Notification::send($usersToNotify, new NewTicketNotification($ticket));
    }
}
