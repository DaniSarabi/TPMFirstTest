<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\User;
use App\Broadcasting\SharePointNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Helpers\NotificationHelper; 

class TicketDowngradedNotification extends Notification implements ShouldQueue
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

        if ($preferences->contains('ticket.downgraded.in_app')) $channels[] = 'database';
        if ($preferences->contains('ticket.downgraded.email')) $channels[] = 'mail';
        if ($preferences->contains('ticket.downgraded.teams')) $channels[] = SharePointNotificationChannel::class;

        return $channels;
    }

    /**
     * El Correo (toMail)
     */
    public function toMail($notifiable): MailMessage
    {
        $url =  NotificationHelper::route('tickets.show', $this->ticket->id);

        return (new MailMessage)
            ->subject("Ticket Priority Downgraded: #{$this->ticket->id} - {$this->ticket->title}")
            ->level('primary') // Azul
            ->line("Ticket Priority Downgraded")
            ->greeting('Hello, ' . $notifiable->name . '!')
            ->line("The priority for ticket #{$this->ticket->id} ({$this->ticket->title}) for machine \"{$this->ticket->machine->name}\" has been downgraded to 'Warning'.")
            ->action('View Ticket Details', $url);
    }

    /**
     * La Notificación In-App (toDatabase)
     */
    public function toDatabase($notifiable): array
    {
        return [
            'message' => "Ticket (#{$this->ticket->id}) for {$this->ticket->machine->name} has been downgraded to 'Warning'.",
            'url' =>  NotificationHelper::route('tickets.show', $this->ticket->id),
            'ticket_id' => $this->ticket->id,
        ];
    }

    /**
     * Los datos para SharePoint/Teams
     */
    public function toTeamsViaSharePoint($notifiable): array
    {
        $ticket = $this->ticket;
        $machine = $ticket->machine->name ?? 'Unknown Machine';
        $issue = $ticket->title ?? 'No title';
        $url =  NotificationHelper::route('tickets.show', $ticket->id);

        $title = "⬇️ Ticket Downgraded — #{$ticket->id}";

        $cardPayload = [
            'type' => 'AdaptiveCard',
            '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
            'version' => '1.5',
            'msteams' => ['width' => 'Full'],
            'body' => [
                // 1. HEADER (Neutral gray)
                [
                    'type' => 'Container',
                    'style' => 'emphasis',
                    'items' => [
                        [
                            'type' => 'TextBlock',
                            'text' => '⬇️ Ticket Downgraded',
                            'weight' => 'Bolder',
                            'size' => 'Medium',
                        ]
                    ],
                    'bleed' => true
                ],
                // 2. JST + Main message
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
                                    'text' => "The priority for ticket **#{$ticket->id} - {$issue}** has been downgraded to **'Warning'**.  
                                Please verify that this downgrade is correct and aligned with maintenance standards.",
                                    'wrap' => true,
                                    'weight' => 'Bolder'
                                ]
                            ]
                        ]
                    ]
                ],
                // 3. FACT SET (details)
                [
                    'type' => 'FactSet',
                    'facts' => [
                        ['title' => 'Ticket ID:', 'value' => "#{$ticket->id}"],
                        ['title' => 'Machine:', 'value' => $machine],
                        ['title' => 'Issue:', 'value' => $issue],
                    ]
                ],
                // 4. EXTRA MESSAGE
                [
                    'type' => 'TextBlock',
                    'text' => "Review this change to ensure it was made following the proper maintenance assessment.",
                    'wrap' => true,
                    'isSubtle' => true,
                ],
                // 5. BUTTON
                [
                    'type' => 'ActionSet',
                    'actions' => [
                        [
                            'type' => 'Action.OpenUrl',
                            'title' => 'View Ticket Details',
                            'url' => $url
                        ]
                    ]
                ],
                // 6. FOOTER
                [
                    'type' => 'TextBlock',
                    'text' => "This is an automated notification from the TPM APP. If you have any questions, contact your system administrator.",
                    'wrap' => true,
                    'size' => 'Small',
                    'isSubtle' => true
                ]
            ]
        ];

        return [
            'title' => $title,
            'message' => json_encode($cardPayload),
            'userEmail' => $notifiable->email,
        ];
    }
}
