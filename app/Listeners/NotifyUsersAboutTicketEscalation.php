<?php

namespace App\Listeners;

use App\Events\TicketEscalated;
use App\Models\User;
use App\Notifications\TicketEscalatedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class NotifyUsersAboutTicketEscalation implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(TicketEscalated $event)
    {
        $ticket = $event->ticket;
        $machine = $ticket->machine;

        $usersToNotify = User::whereHas('notificationPreferences', function ($query) use ($machine) {
            $query->where(function ($q) {
                $q->where('notification_type', 'ticket.escalated.in_app')
                    ->orWhere('notification_type', 'ticket.escalated.email')
                    ->orWhere('notification_type', 'ticket.escalated.teams');
            })
                ->where(function ($q) use ($machine) {
                    $q->whereNull('preferable_id')
                        ->orWhere(function ($q2) use ($machine) {
                            $q2->where('preferable_id', $machine->id)
                                ->where('preferable_type', 'App\\Models\\Machine');
                        });
                });
        })->get();

        if ($usersToNotify->isEmpty()) {
            Log::info("No users subscribed to 'ticket.escalated' for ticket #{$ticket->id}.");
            return;
        }

        Log::info("Notifying {$usersToNotify->count()} users about escalated ticket #{$ticket->id}.");
        Notification::send($usersToNotify, new TicketEscalatedNotification($ticket));
    }
}
