<?php

namespace App\Listeners;

use App\Events\MaintenanceReminderSent;
use App\Models\User;
use App\Notifications\MaintenanceReminderNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class NotifyUsersAboutMaintenanceReminder implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(MaintenanceReminderSent $event)
    {
        $maintenance = $event->maintenance;
        $machine = $maintenance->schedulable_type === 'App\Models\Machine'
            ? $maintenance->schedulable
            : $maintenance->schedulable->machine;

        if (!$machine) {
            Log::warning("Cannot send Reminder notification for maintenance #{$maintenance->id}, no machine found.");
            return;
        }

        $usersToNotify = User::whereHas('notificationPreferences', function ($query) use ($machine) {
            $query->where(function ($q) {
                $q->where('notification_type', 'maintenance.reminder.in_App')
                    ->orWhere('notification_type', 'maintenance.reminder.email')
                    ->orWhere('notification_type', 'maintenance.reminder.teams');
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
            Log::info("No users subscribed to 'maintenance.reminder' for maintenance #{$maintenance->id}.");
            return;
        }

        Log::info("Notifying {$usersToNotify->count()} users about maintenance reminder #{$maintenance->id}.");
        Notification::send($usersToNotify, new MaintenanceReminderNotification($maintenance));
    }
}
