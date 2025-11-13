<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\User;
use App\Broadcasting\SharePointNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketEscalatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Ticket $ticket;

    public function __construct(Ticket $ticket)
    {
        $this->ticket = $ticket;
    }

    /**
     * La "Aduana"
     */
    public function via(User $notifiable): array
    {
        $channels = [];
        $preferences = $notifiable->notificationPreferences
            ->filter(function ($pref) {
                if ($pref->preferable_id === null) return true;
                if ($pref->preferable_id === $this->ticket->machine_id && $pref->preferable_type === 'App\Models\Machine') return true;
                return false;
            })
            ->pluck('notification_type')
            ->unique();

        if ($preferences->contains('ticket.escalated.in_app')) $channels[] = 'database';
        if ($preferences->contains('ticket.escalated.email')) $channels[] = 'mail';
        if ($preferences->contains('ticket.escalated.teams')) $channels[] = SharePointNotificationChannel::class;

        return $channels;
    }

    /**
     * El Correo (toMail)
     */
    public function toMail($notifiable): MailMessage
    {
        $url = route('tickets.show', $this->ticket->id);

        return (new MailMessage)
            ->subject("🔥 TICKET ESCALATED TO CRITICAL PRIORITY: #{$this->ticket->id} - {$this->ticket->title}")
            ->level('error') // ¡Color Rojo!
            ->line("Priority scalated to critical")
            ->greeting('Hello, ' . $notifiable->name . '!')
            ->line("The ticket #{$this->ticket->id} ({$this->ticket->title}) for machine {$this->ticket->machine->name} has been escalated to CRITICAL priority.")
            ->action('View Ticket Details Immediately', $url);
    }

    /**
     * La Notificación In-App (toDatabase)
     */
    public function toDatabase($notifiable): array
    {
        return [
            'message' => "🔥 Ticket (#{$this->ticket->id}) for {$this->ticket->machine->name} has been escalated to CRITICAL.",
            'url' => route('tickets.show', $this->ticket->id),
            'ticket_id' => $this->ticket->id,
        ];
    }

    /**
     * Los datos para SharePoint/Teams
     */
    public function toTeamsViaSharePoint($notifiable): array
    {
        $title = "🔥 TICKET CRÍTICO: #{$this->ticket->id} ({$this->ticket->machine->name})";

        // El logo placeholder (JST en rojo sobre azul)
        $logoUrl = "https://placehold.co/100x100/0056b3/dc3545.png?text=JST&font=arial";

        $cardPayload = [
            'type' => 'AdaptiveCard',
            '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
            'version' => '1.5',
            'msteams' => ['width' => 'Full'],
            'body' => [
                // 1. HEADER (Rojo/Attention)
                [
                    'type' => 'Container',
                    'style' => 'attention', // ¡Estilo rojo de alerta!
                    'items' => [
                        [
                            'type' => 'TextBlock',
                            'text' => '🔥 Priority Escalated to CRITICAL',
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
                                    'type' => 'Image',
                                    'url' => $logoUrl,
                                    'altText' => 'JST Logo',
                                    'size' => 'small',
                                    'style' => 'person', // Círculo
                                ]
                            ]
                        ],
                        [
                            'type' => 'Column',
                            'width' => 'stretch',
                            'items' => [
                                [
                                    'type' => 'TextBlock',
                                    'text' => "The ticket **{$this->ticket->title}** requires immediate attention.",
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
                        ['title' => 'New Priority:', 'value' => 'Critical (P2)'],
                    ]
                ],
                 [
                    'type' => 'TextBlock',
                    'text' => "The ticket has been escalated to CRITICAL priority. Please review immediately.",
                    'wrap' => true,
                    'isSubtle' => true,
                ],
                // 4. BOTÓN
                [
                    'type' => 'ActionSet',
                    'actions' => [
                        [
                            'type' => 'Action.OpenUrl',
                            'title' => 'View Ticket Details Immediately',
                            'url' => route('tickets.show', $this->ticket->id)
                        ]
                    ]
                ],
                // 5. FOOTER
                [
                    'type' => 'TextBlock',
                    'text' => "This is an automated notification from the TPM APP.",
                    'wrap' => true,
                    'size' => 'Small',
                    'isSubtle' => true
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
