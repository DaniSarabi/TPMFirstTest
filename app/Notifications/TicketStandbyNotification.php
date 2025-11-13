<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\User;
use App\Broadcasting\SharePointNotificationChannel; // Asegúrate que el namespace sea el correcto
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketStandbyNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Ticket $ticket;
    public string $statusName;

    /**
     * Create a new notification instance.
     */
    public function __construct(Ticket $ticket, string $statusName)
    {
        $this->ticket = $ticket;
        $this->statusName = $statusName;
    }

    /**
     * The "Gateway" (Paso 5)
     * Filters channels based on user preferences.
     */
    public function via(User $notifiable): array
    {
        $channels = [];
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

                return false;
            })
            ->pluck('notification_type')
            ->unique();

        // 3. ¡Aquí busca las preferencias de "awaiting_parts"!
        if ($preferences->contains('ticket.awaiting_parts.in_app')) {
            $channels[] = 'database';
        }
        if ($preferences->contains('ticket.awaiting_parts.email')) {
            $channels[] = 'mail';
        }
        if ($preferences->contains('ticket.awaiting_parts.teams')) {
            $channels[] = SharePointNotificationChannel::class;
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification (toMail)
     */
    public function toMail($notifiable): MailMessage
    {
        $url = route('tickets.show', $this->ticket->id);

        return (new MailMessage)
            ->subject("Ticket On Hold: #{$this->ticket->id} - {$this->ticket->title}")
            ->level('warning') // Usamos el color amarillo/ámbar
            ->line("Ticket Status: {$this->statusName}") // 4. Usamos el nombre real
            ->greeting('Hello, ' . $notifiable->name . '!')
            ->line("Ticket #{$this->ticket->id} ({$this->ticket->title}) for machine **{$this->ticket->machine->name}** has a new status.")
            ->line("The status has been updated to: **{$this->statusName}**.") // 5. Usamos el nombre real
            ->action('View Ticket Details', $url)
            ->line('Thank you for using the TPM application.');
    }

    /**
     * The In-App Notification (toDatabase)
     */
    public function toDatabase($notifiable): array
    {
        return [
            'message' => "Ticket (#{$this->ticket->id}) for {$this->ticket->machine->name} is now on hold (Status: {$this->statusName}).", // 6. Usamos el nombre real
            'url' => route('tickets.show', $this->ticket->id),
            'ticket_id' => $this->ticket->id,
        ];
    }

    /**
     * Data for SharePoint/Teams (toTeamsViaSharePoint)
     */
    public function toTeamsViaSharePoint($notifiable): array
    {
        $ticket = $this->ticket;
        $machine = $ticket->machine->name ?? 'Unknown Machine';
        $issue = $ticket->title ?? 'No title';
        $status = $this->statusName ?? 'On Hold';
        $url = route('tickets.show', $ticket->id);
        $title = "⏸️ Ticket On Hold — #{$ticket->id}";

        $cardPayload = [
            'type' => 'AdaptiveCard',
            '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
            'version' => '1.5',
            'msteams' => ['width' => 'Full'],
            'body' => [
                // 1. HEADER (light gray)
                [
                    'type' => 'Container',
                    'style' => 'emphasis',
                    'items' => [
                        [
                            'type' => 'TextBlock',
                            'text' => '⏸️ Ticket On Hold',
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
                                    'color' => 'Attention', // red JST label
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
                                    'text' => "Ticket **#{$ticket->id} - {$issue}** for **{$machine}** is currently **on hold**.  
                                The new status is **{$status}**.",
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
                        ['title' => 'Current Status:', 'value' => $status],
                    ]
                ],
                // 4. INFO MESSAGE
                [
                    'type' => 'TextBlock',
                    'text' => "This ticket has been placed on hold — usually due to missing parts, pending approval, or external dependencies.  
                Maintenance teams should monitor this ticket until it resumes activity.",
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
                    'text' => "This is an automated notification from the TPM APP. For questions, contact your system administrator.",
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
