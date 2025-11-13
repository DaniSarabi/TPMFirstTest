<?php

namespace App\Listeners;

use App\Events\InspectionCompleted;
use App\Models\User;
use App\Notifications\InspectionCompletedNotification;
use App\Notifications\InspectionFailedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class NotifyUsersAboutInspection implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     *
     * @param  \App\Events\InspectionCompleted  $event
     * @return void
     */
    public function handle(InspectionCompleted $event)
    {
        $report = $event->inspectionReport;

        // Cargar las relaciones necesarias que usaremos
        $report->load('machine', 'user', 'items.status');

        $statusCounts = [
            'OK' => 0,
            'Warning' => 0,
            'Critical' => 0,
        ];

        foreach ($report->items as $item) {
            if ($item->status) {
                if ($item->status->severity === 0) {
                    $statusCounts['OK']++;
                } elseif ($item->status->severity === 1) {
                    $statusCounts['Warning']++;
                } elseif ($item->status->severity === 2) {
                    $statusCounts['Critical']++;
                }
            }
        }

        $hasFailures = $statusCounts['Warning'] > 0 || $statusCounts['Critical'] > 0;


        if ($hasFailures) {
            // --- Caso 1: La inspección FALLÓ ---
            $notificationType = 'inspection.failed';
            $notificationToSend = new InspectionFailedNotification($report, $statusCounts);
            $logMessage = "inspection.failed";
        } else {
            // --- Caso 2: La inspección pasó LIMPIA ---
            $notificationType = 'inspection.completed';
            $notificationToSend = new InspectionCompletedNotification($report, $statusCounts);
            $logMessage = "inspection.completed";
        }

        // Buscamos a los usuarios suscritos a los canales de ESE evento
        $usersToNotify = User::whereHas('notificationPreferences', function ($query) use ($report, $notificationType) {
            $query->where(function ($q) use ($notificationType) {
                $q->where('notification_type', "{$notificationType}.in_app")
                    ->orWhere('notification_type', "{$notificationType}.email")
                    ->orWhere('notification_type', "{$notificationType}.teams");
            })
                ->where(function ($q) use ($report) {
                    $q->whereNull('preferable_id')
                        ->orWhere(function ($q2) use ($report) {
                            $q2->where('preferable_id', $report->machine_id)
                                ->where('preferable_type', 'App\\Models\\Machine');
                        });
                });
        })->get();

        if ($usersToNotify->isEmpty()) {
            Log::info("No users subscribed to '{$logMessage}' for report #{$report->id}.");
            return;
        }

        Log::info("Notifying {$usersToNotify->count()} users about {$logMessage} report #{$report->id}.");

        // ¡La Magia! Laravel y la "Aduana" (via()) hacen el resto.
        Notification::send($usersToNotify, $notificationToSend);
    }
}
