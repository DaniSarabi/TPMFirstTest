<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\User;
// 1. Importamos el "Canal" de Teams/SharePoint que crearemos en el Paso 4
use App\Broadcasting\SharePointNotificationChannel;
use App\Helpers\NotificationHelper; 

class NewTicketNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Ticket $ticket;

    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct(Ticket $ticket)
    {
        $this->ticket = $ticket;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via(User $notifiable): array
    {
        $channels = [];

        // --- ¡FIX! ---
        // Usamos ->filter() para filtrar una Colección que ya está cargada.
        // Ya no usamos ->where() ni ->orWhere() aquí.
        $preferences = $notifiable->notificationPreferences->filter(function ($pref) {
            // Condición 1: Es una preferencia Global (preferable_id es null)
            if ($pref->preferable_id === null) {
                return true;
            }

            // Condición 2: Es una preferencia específica para ESTA máquina
            if ($pref->preferable_id === $this->ticket->machine_id && $pref->preferable_type === 'App\Models\Machine') {
                return true;
            }

            // Si no es ninguna de las dos, la descartamos
            return false;
        })
            ->pluck('notification_type') // Ahora sí, sacamos los nombres
            ->unique();

        // 3. Construimos el array de canales (esta lógica estaba perfecta)
        if ($preferences->contains('ticket.created.in_app')) {
            $channels[] = 'database';
        }
        if ($preferences->contains('ticket.created.email')) {
            $channels[] = 'mail';
        }
        if ($preferences->contains('ticket.created.teams')) {
            $channels[] = SharePointNotificationChannel::class;
        }

        return $channels; // Devolvemos los canales que SÍ quiere el usuario
    }


    /**
     * Get the mail representation of the notification. (El Correo)
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable): MailMessage
    {
        $url =  NotificationHelper::route('tickets.show', $this->ticket->id);
        $priorityText = $this->ticket->priority == 2 ? 'Critical' : 'Warning';
        $color = $this->ticket->priority == 2 ? 'error' : 'primary'; // 'error' (rojo), 'primary' (azul), 'success' (verde)

        return (new MailMessage)
            // 1. El Tema (Subject)
            ->subject("New Ticket [{$priorityText}]: {$this->ticket->title}")

            // 2. El Color del Botón y el Header
            ->level($color)

            // 3. El Contenido (Markdown)
            ->greeting('¡Hola, ' . $notifiable->name . '!')
            ->line("Se ha creado un nuevo ticket para la máquina: {$this->ticket->machine->name}.")
            ->line("Reportado por: {$this->ticket->creator->name}.")
            ->lineIf($this->ticket->description, "Descripción: {$this->ticket->description}")

            // 4. El Botón
            ->action('Ver Ticket Ahora', $url)

            ->line("Please address this ticket as soon as possible.")

            ->line('Gracias por usar la aplicación de TPM.');
    }

    /**
     * Get the array representation of the notification (para In-App).
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toDatabase($notifiable): array
    {
        // Esto es lo que se guardará en la columna 'data' de la tabla 'notifications'
        return [
            'message' => "Nuevo ticket (#{$this->ticket->id}) creado para {$this->ticket->machine->name}.",
            'url' =>  NotificationHelper::route('tickets.show', $this->ticket->id),
            'ticket_id' => $this->ticket->id,
        ];
    }

    /**
     * --- ¡TU SUGERENCIA! ---
     * Prepara los datos para ser enviados a SharePoint/Teams.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toTeamsViaSharePoint($notifiable): array
    {
        $url =  NotificationHelper::route('tickets.show', $this->ticket->id);
        $priorityText = $this->ticket->priority == 2 ? 'Critical' : 'Warning';
        $headerStyle = $this->ticket->priority == 2 ? 'attention' : 'emphasis'; // Red or Gray
        $headerText = $this->ticket->priority == 2 ? '🔥 New Critical Ticket' : '🎟️ New Ticket Created';

        $title = "🎫 New Ticket [{$priorityText}]: #{$this->ticket->id} ({$this->ticket->machine->name})";

        // ✅ Adaptive Card Payload (Same structure as working ones)
        $cardPayload = [
            'type' => 'AdaptiveCard',
            '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
            'version' => '1.5',
            'msteams' => ['width' => 'Full'],
            'body' => [
                // 1. HEADER
                [
                    'type' => 'Container',
                    'style' => $headerStyle,
                    'items' => [
                        [
                            'type' => 'TextBlock',
                            'text' => $headerText,
                            'weight' => 'Bolder',
                            'size' => 'Medium',
                        ]
                    ],
                    'bleed' => true
                ],

                // 2. JST + TITLE
                [
                    'type' => 'ColumnSet',
                    'columns' => [
                        [
                            'type' => 'Column',
                            'width' => 'auto',
                            'items' => [
                                [
                                    'type' => 'TextBlock',
                                    'text' => 'JST',
                                    'weight' => 'Bolder',
                                    'color' => 'Attention',
                                    'size' => 'Large',
                                ]
                            ],
                            'verticalContentAlignment' => 'Center',
                        ],
                        [
                            'type' => 'Column',
                            'width' => 'stretch',
                            'items' => [
                                [
                                    'type' => 'TextBlock',
                                    'text' => "**{$this->ticket->title}**",
                                    'wrap' => true,
                                    'weight' => 'Bolder',
                                    'size' => 'Large',
                                ]
                            ],
                        ]
                    ]
                ],

                // 3. FACT SET
                [
                    'type' => 'FactSet',
                    'facts' => [
                        ['title' => 'Ticket ID:', 'value' => (string)$this->ticket->id],
                        ['title' => 'Machine:', 'value' => $this->ticket->machine->name],
                        ['title' => 'Reported By:', 'value' => $this->ticket->creator->name],
                        ['title' => 'Priority:', 'value' => $priorityText],
                    ]
                ],

                // 4. DESCRIPTION (Optional)
                ...(!empty($this->ticket->description) ? [[
                    'type' => 'Container',
                    'style' => 'emphasis',
                    'items' => [
                        [
                            'type' => 'TextBlock',
                            'text' => $this->ticket->description,
                            'wrap' => true,
                            'isSubtle' => true,
                        ]
                    ],
                    'bleed' => true
                ]] : []),

                // 5. BUTTON
                [
                    'type' => 'ActionSet',
                    'actions' => [
                        [
                            'type' => 'Action.OpenUrl',
                            'title' => 'View Ticket Details',
                            'url' => $url,
                        ]
                    ]
                ],

                // 6. FOOTER
                [
                    'type' => 'TextBlock',
                    'text' => "This is an automated notification from the TPM APP. If you have any questions, contact your system administrator.",
                    'wrap' => true,
                    'size' => 'Small',
                    'isSubtle' => true,
                ]
            ]
        ];

        // ✅ Return the same structure as working notifications
        return [
            'title' => $title,
            'message' => json_encode($cardPayload),
            'userEmail' => $notifiable->email,
        ];
    }
}
