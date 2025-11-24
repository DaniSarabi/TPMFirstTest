<?php

namespace App\Listeners;

use App\Events\TechnicianCoachingTriggered;
use App\Notifications\TechnicianCoachingNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Models\TicketUpdate; // Importar modelo
use App\Models\Ticket; // Importar modelo
use App\Models\App\Models\AiInsight; // Importar modelo
use App\Models\User;



class SendTechnicianCoachingNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(TechnicianCoachingTriggered $event)
    {
        $ticket = $event->ticket;
        $insight = $event->insight;

        // --- ¡LA CORRECCIÓN! ---
        // Buscamos al técnico que REALMENTE solucionó/cerró el ticket.
        // La lógica es: El usuario del último update que tenga 'action_taken' (la solución).

        /** @var TicketUpdate|null $resolutionUpdate */
        $resolutionUpdate = $ticket->updates()
            ->whereNotNull('action_taken') // Buscamos donde se escribió la solución
            ->with('user')
            ->latest()
            ->first();

        // Fallback: Si por alguna razón no hay action_taken, buscamos quién cambió el estatus a cerrado
        if (!$resolutionUpdate) {
            $resolutionUpdate = $ticket->updates()
                ->whereHas('newStatus.behaviors', fn($q) => $q->where('name', 'is_ticket_closing_status'))
                ->with('user')
                ->latest()
                ->first();
        }

        $technician = $resolutionUpdate ? $resolutionUpdate->user : null;
        // $technician = User::find(2);


        if (!$technician) {
            Log::warning("Cannot send coaching for ticket #{$ticket->id}: No resolving technician found in history.");
            return;
        }

        Log::info("Sending AI Coaching Tip to technician {$technician->name} for ticket #{$ticket->id}.");

        // Enviamos la "Carta" al técnico encontrado
        Notification::send($technician, new TechnicianCoachingNotification($ticket, $insight));
    }
}
