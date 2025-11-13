<?php

namespace App\Listeners;

use App\Events\TicketStatusChanged;
use App\Models\User; // 1. Importar User
use App\Notifications\TicketClosedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log; // 2. Importar Log
use App\Notifications\TicketDiscardedNotification;
use App\Notifications\TicketStandbyNotification;

class NotifyUsersAboutTicketUpdate implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     *
     * @param  object  $event
     * @return void
     */
    public function handle(TicketStatusChanged $event)
    {
        $ticketUpdate = $event->ticketUpdate;
        $ticket = $ticketUpdate->ticket->load('creator', 'machine');
        $newStatus = $ticketUpdate->newStatus; // El modelo NewStatus ya viene del EventServiceProvider

        Log::info("Enter handle");
        Log::info("Ticked Status Changed to {$newStatus->name}");
        // --- EL ROUTER DE LÓGICA ---

        // 1. ¿Se está cerrando el ticket?
        if ($newStatus->behaviors->contains('name', 'is_ticket_closing_status')) {

            // --- ¡AQUÍ ESTÁ TU CORRECCIÓN! ---
            // 3. Buscamos a TODOS los usuarios suscritos a CUALQUIER canal de "ticket.closed"
            $usersToNotify = User::whereHas('notificationPreferences', function ($query) use ($ticket) {
                $query->where(function ($q) {
                    $q->where('notification_type', 'ticket.closed.in_app')
                        ->orWhere('notification_type', 'ticket.closed.email')
                        ->orWhere('notification_type', 'ticket.closed.teams');
                })
                    ->where(function ($q) use ($ticket) {
                        // Que aplique Global O para esta máquina específica
                        $q->whereNull('preferable_id')
                            ->orWhere(function ($q2) use ($ticket) {
                                $q2->where('preferable_id', $ticket->machine_id)
                                    ->where('preferable_type', 'App\\Models\\Machine');
                            });
                    });
            })->get();

            if ($usersToNotify->isEmpty()) {
                Log::info("No users subscribed to any 'ticket.closed' channel for machine #{$ticket->machine_id}.");
                return;
            }

            Log::info("Found {$usersToNotify->count()} users to notify about closed ticket #{$ticket->id}.");

            // 4. Se lo enviamos a todos ellos. La "Aduana" (via()) filtrará por cada uno.
            Notification::send($usersToNotify, new TicketClosedNotification($ticket));
        } else if ($newStatus->behaviors->contains('name', 'is_ticket_discard_status')) {

            $usersToNotify = User::whereHas('notificationPreferences', function ($query) use ($ticket) {
                $query->where(function ($q) {
                    $q->where('notification_type', 'ticket.discarded.in_app')
                        ->orWhere('notification_type', 'ticket.discarded.email')
                        ->orWhere('notification_type', 'ticket.discarded.teams');
                })
                    ->where(function ($q) use ($ticket) {
                        $q->whereNull('preferable_id')
                            ->orWhere(function ($q2) use ($ticket) {
                                $q2->where('preferable_id', $ticket->machine_id)
                                    ->where('preferable_type', 'App\\Models\\Machine');
                            });
                    });
            })->get();

            if ($usersToNotify->isEmpty()) {
                Log::info("No users subscribed to any 'ticket.discarded' channel for ticket #{$ticket->id}.");
                return;
            }

            Log::info("Found {$usersToNotify->count()} users to notify about discarded ticket #{$ticket->id}.");
            Notification::send($usersToNotify, new TicketDiscardedNotification($ticket));
        } else if ($newStatus->behaviors->contains('name', 'is_stand_by_status')) {

            $usersToNotify = User::whereHas('notificationPreferences', function ($query) use ($ticket) {
                $query->where(function ($q) {
                    // Usamos las llaves de "awaiting_parts" que definimos en el config
                    $q->where('notification_type', 'ticket.awaiting_parts.in_app')
                        ->orWhere('notification_type', 'ticket.awaiting_parts.email')
                        ->orWhere('notification_type', 'ticket.awaiting_parts.teams');
                })
                    ->where(function ($q) use ($ticket) {
                        $q->whereNull('preferable_id')
                            ->orWhere(function ($q2) use ($ticket) {
                                $q2->where('preferable_id', $ticket->machine_id)
                                    ->where('preferable_type', 'App\\Models\\Machine');
                            });
                    });
            })->get();

            if ($usersToNotify->isEmpty()) {
                Log::info("No users subscribed to any 'ticket.awaiting_parts' channel for ticket #{$ticket->id}.");
                return;
            }

            Log::info("Found {$usersToNotify->count()} users to notify about standby ticket #{$ticket->id}.");
            Notification::send($usersToNotify, new TicketStandbyNotification($ticket, $newStatus->name));
        }
    }
}
