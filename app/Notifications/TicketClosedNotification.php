<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Broadcasting\SharePointNotificationChannel;
use App\Helpers\NotificationHelper; 


class TicketClosedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Ticket $ticket;

    /**
     * Create a new notification instance.
     */
    public function __construct(Ticket $ticket)
    {
        $this->ticket = $ticket;
    }

    /**
     * La "Aduana" (Paso 5)
     * --- ¡AQUÍ ESTÁ EL SEGUNDO FIX! ---
     * Esta lógica ahora SÍ revisa las preferencias globales Y las de la máquina.
     */
    public function via(User $notifiable): array
    {
        $channels = [];
        // Usamos ->filter() porque $notifiable->notificationPreferences ya es una Colección cargada
        $preferences = $notifiable->notificationPreferences
            ->filter(function ($pref) {
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
            ->pluck('notification_type')
            ->unique();

        // Esta lógica estaba perfecta
        if ($preferences->contains('ticket.closed.in_app')) {
            $channels[] = 'database';
        }
        if ($preferences->contains('ticket.closed.email')) {
            $channels[] = 'mail';
        }
        if ($preferences->contains('ticket.closed.teams')) {
            $channels[] = SharePointNotificationChannel::class;
        }

        return $channels;
    }

    /**
     * El Correo (toMail)
     */
    public function toMail($notifiable): MailMessage
    {
        $url =  NotificationHelper::route('tickets.show', $this->ticket->id);

        return (new MailMessage)
            ->subject("Ticket Resolved: #{$this->ticket->id} - {$this->ticket->title}")
            ->level('success') // Green color
            ->line("Ticket Resolved") // This populates the custom header.blade.php
            ->greeting('Hello, ' . $notifiable->name . '!')
            ->line("The ticket on the machine {$this->ticket->machine->name} has been marked as resolved.")
            ->line("Issue: {$this->ticket->title}")
            ->action('View Ticket Details', $url)
            ->line('Thank you for using the TPM application.');
    }

    /**
     * La Notificación In-App (toDatabase)
     */
    public function toDatabase($notifiable): array
    {
        return [
            'message' => "The ticket (#{$this->ticket->id}) for {$this->ticket->machine->name} has been resolved.",
            'url' =>  NotificationHelper::route('tickets.show', $this->ticket->id),
            'ticket_id' => $this->ticket->id,
        ];
    }

    /**
     * Los datos para SharePoint/Teams (toTeamsViaSharePoint)
     */
    public function toTeamsViaSharePoint($notifiable): array
    {

        $title = "✅ Ticket Resolved: #{$this->ticket->id} ({$this->ticket->machine->name})";

        // El logo placeholder (JST en rojo sobre azul)
        // $logoUrl = "https://placehold.co/100x100/0056b3/dc3545.png?text=JST&font=arial";

        $cardPayload = [
            'type' => 'AdaptiveCard',
            '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
            'version' => '1.5',
            'msteams' => ['width' => 'Full'],
            'body' => [
                // 1. HEADER (Verde/Success)
                [
                    'type' => 'Container',
                    'style' => 'good', // ¡Estilo verde de éxito!
                    'items' => [
                        [
                            'type' => 'TextBlock',
                            'text' => '✅ Ticket Resolved',
                            'weight' => 'Bolder',
                            'size' => 'Medium',
                        ]
                    ],
                    'bleed' => true
                ],
                // 2. SECCIÓN DE COLUMNAS (Logo + Título)
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
                                    'color' => 'Attention', // red
                                    'size' => 'Large'
                                ]
                            ],
                            'verticalContentAlignment' => 'Center'
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
                                    'size' => 'Large'
                                ]
                            ]
                        ]
                    ]
                ],
                // 3. SET DE DATOS (El Resumen)
                [
                    'type' => 'FactSet',
                    'facts' => [
                        ['title' => 'Ticket ID:', 'value' => (string)$this->ticket->id],
                        ['title' => 'Machine:', 'value' => $this->ticket->machine->name],
                        ['title' => 'Reported By:', 'value' => $this->ticket->creator->name],
                    ]
                ],
                // 4. BOTÓN
                [
                    'type' => 'ActionSet',
                    'actions' => [
                        [
                            'type' => 'Action.OpenUrl',
                            'title' => 'View Ticket Details',
                            'url' =>  NotificationHelper::route('tickets.show', $this->ticket->id)
                        ]
                    ]
                ],
                // 5. FOOTER
                [
                    'type' => 'TextBlock',
                    'text' => "This is an automated notification from the TPM APP. If you have any questions, contact your system administrator.",
                    'wrap' => true,
                    'size' => 'Small', // Letra chiquita
                    'isSubtle' => true // Color gris
                ]
            ]
        ];

        return [
            'title' => $title,
            'message' => json_encode($cardPayload), // Pasamos el JSON
            'userEmail' => $notifiable->email,
        ];
    }
}
