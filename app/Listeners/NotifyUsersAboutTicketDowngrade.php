<?php

namespace App\Listeners;

use App\Events\TicketDowngraded;
use App\Models\User;
use App\Notifications\TicketDowngradedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class NotifyUsersAboutTicketDowngrade implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(TicketDowngraded $event)
    {
        $ticket = $event->ticket;
        $machine = $ticket->machine;

        $usersToNotify = User::whereHas('notificationPreferences', function ($query) use ($machine) {
            $query->where(function ($q) {
                $q->where('notification_type', 'ticket.downgraded.in_app')
                    ->orWhere('notification_type', 'ticket.downgraded.email')
                    ->orWhere('notification_type', 'ticket.downgraded.teams');
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
            Log::info("No users subscribed to 'ticket.downgraded' for ticket #{$ticket->id}.");
            return;
        }

        Log::info("Notifying {$usersToNotify->count()} users about downgraded ticket #{$ticket->id}.");
        Notification::send($usersToNotify, new TicketDowngradedNotification($ticket));
    }
}
