<?php

namespace App\Listeners;

use App\Events\MaintenanceBecameOverdue;
use App\Models\User;
use App\Models\EscalationPolicy;
use App\Notifications\MaintenanceOverdueEscalation; // Carta para Gerentes
use App\Notifications\MaintenanceOverdueFYI;        // Carta para Técnicos
use App\Services\GraphApiService;                     // El "Camión de Reparto" de Teams
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class HandleOverdueMaintenanceNotifications implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(protected GraphApiService $graphApi)
    {
        // Inyectamos el servicio de Graph API
    }

    public function handle(MaintenanceBecameOverdue $event)
    {
        $maintenance = $event->maintenance->load('schedulable'); // Cargar la relación
        $machine = $maintenance->schedulable_type === 'App\Models\Machine'
            ? $maintenance->schedulable
            : $maintenance->schedulable->machine;

        if (!$machine) {
            Log::warning("Cannot process Overdue notification for maintenance #{$maintenance->id}, no machine found.");
            return;
        }

        // --- 1. LÓGICA DE ESCALACIÓN (Para Gerentes) ---
        $policy = EscalationPolicy::where('name', 'Overdue Maintenance')->where('is_active', true)->first();
        $daysOverdue = $maintenance->scheduled_date->addDays($maintenance->grace_period_days)->diffInDays(Carbon::today());
        $levelToSend = null;
        $nextLevel = null;
        $escalationMessage = "This task is currently overdue by {$daysOverdue} days."; // Mensaje default

        if ($policy) {
            $levelToSend = $policy->levels()->where('days_after', '<=', $daysOverdue)->orderBy('level', 'desc')->first();
            $nextLevel = $policy->levels()->where('days_after', '>', $daysOverdue)->orderBy('level', 'asc')->first();

            if ($levelToSend) {
                $contacts = $levelToSend->emailContacts;
                if ($contacts->isNotEmpty()) {
                    Log::info("Escalating overdue maintenance #{$maintenance->id} to Level {$levelToSend->level}.");
                    $escalationMessage = "Escalation Level {$levelToSend->level} has been notified.";

                    // Enviamos la "Carta" de Escalación (Forzosa)
                    foreach ($contacts as $contact) {
                        // A. Enviar Correo Forzoso
                        Notification::route('mail', $contact->email)
                            ->notify(new MaintenanceOverdueEscalation($maintenance, $daysOverdue));

                        // B. Enviar a SharePoint/Teams Forzoso
                        $teamsData = (new MaintenanceOverdueEscalation($maintenance, $daysOverdue))->toTeamsViaSharePoint($contact);
                        $this->graphApi->createNotification(
                            $teamsData['title'],
                            $teamsData['message'],
                            $contact->email
                        );
                    }
                }
            } elseif ($nextLevel) {
                // ¡Tu idea del "aviso"!
                $daysUntilNext = $nextLevel->days_after - $daysOverdue;
                $escalationMessage = "This task is overdue. Level {$nextLevel->level} will be notified in {$daysUntilNext} day(s).";
            }
        }

        // --- 2. LÓGICA DE NOTIFICACIÓN (Para Técnicos/App Users) ---
        $usersToNotify = User::whereHas('notificationPreferences', function ($query) use ($machine) {
            $query->where(function ($q) {
                $q->where('notification_type', 'maintenance.overdue.in_app')
                    ->orWhere('notification_type', 'maintenance.overdue.email')
                    ->orWhere('notification_type', 'maintenance.overdue.teams');
            })
                ->where(function ($q) use ($machine) {
                    $q->whereNull('preferable_id')
                        ->orWhere(function ($q2) use ($machine) {
                            $q2->where('preferable_id', $machine->id)
                                ->where('preferable_type', 'App\\Models\\Machine');
                        });
                });
        })->get();

        if ($usersToNotify->isNotEmpty()) {
            Log::info("Notifying {$usersToNotify->count()} app users about overdue maintenance #{$maintenance->id}.");
            // Enviamos la "Carta" de FYI (Inteligente)
            Notification::send($usersToNotify, new MaintenanceOverdueFYI($maintenance, $escalationMessage));
        }
    }
}
