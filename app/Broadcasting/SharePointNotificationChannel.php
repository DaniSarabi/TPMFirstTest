<?php

namespace App\Broadcasting;

use Illuminate\Notifications\Notification;
use App\Services\GraphApiService; // 1. Importamos nuestro "Camión de Reparto"
use Illuminate\Support\Facades\Log;

class SharePointNotificationChannel
{
    /**
     * Nuestro servicio de Graph API.
     */
    protected $graphApi;

    /**
     * Inyectamos el servicio para poder usarlo.
     */
    public function __construct(GraphApiService $graphApi)
    {
        $this->graphApi = $graphApi;
    }

    /**
     * "Punto de entrada" que Laravel llama cuando enviamos una notificación.
     *
     * @param  mixed  $notifiable (El modelo User)
     * @param  \Illuminate\Notifications\Notification  $notification (La "Carta", ej. NewTicketNotification)
     * @return void
     */
    public function send($notifiable, Notification $notification)
    {
        // 2. Verificamos si la "Carta" tiene nuestro método personalizado.
        if (! method_exists($notification, 'toTeamsViaSharePoint')) {
            Log::warning("La notificación " . get_class($notification) . " no tiene el método toTeamsViaSharePoint().");
            return;
        }

        // 3. Obtenemos los datos listos para SharePoint (del Paso 3)
        $data = $notification->toTeamsViaSharePoint($notifiable);

        // 4. Se los pasamos al "Camión de Reparto" (del Paso 2)
        $this->graphApi->createNotification(
            $data['title'],
            $data['message'],
            $data['userEmail']
        );
    }
}
