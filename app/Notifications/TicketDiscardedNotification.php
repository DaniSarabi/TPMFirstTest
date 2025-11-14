<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\User;
use App\Broadcasting\SharePointNotificationChannel; // Ensure this namespace is correct (App\Channels or App\Broadcasting)
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Helpers\NotificationHelper; 

class TicketDiscardedNotification extends Notification implements ShouldQueue
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
     * The "Gateway" (Step 5)
     * Filters channels based on user preferences.
     */
    public function via(User $notifiable): array
    {
        $channels = [];
        $preferences = $notifiable->notificationPreferences
            ->filter(function ($pref) {
                // Condition 1: It's a Global preference (preferable_id is null)
                if ($pref->preferable_id === null) {
                    return true;
                }

                // Condition 2: It's a specific preference for THIS machine
                if ($pref->preferable_id === $this->ticket->machine_id && $pref->preferable_type === 'App\Models\Machine') {
                    return true;
                }

                return false;
            })
            ->pluck('notification_type')
            ->unique();

        // 3. Check for the new preferences here!
        if ($preferences->contains('ticket.discarded.in_app')) {
            $channels[] = 'database';
        }
        if ($preferences->contains('ticket.discarded.email')) {
            $channels[] = 'mail';
        }
        if ($preferences->contains('ticket.discarded.teams')) {
            $channels[] = SharePointNotificationChannel::class;
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification (toMail)
     */
    public function toMail($notifiable): MailMessage
    {
        $url =  NotificationHelper::route('tickets.show', $this->ticket->id);

        return (new MailMessage)
            ->subject("Ticket Discarded: #{$this->ticket->id} - {$this->ticket->title}")
            ->level('primary') // Blue (neutral)
            ->line("Ticket Discarded")
            ->greeting('Hello, ' . $notifiable->name . '!')
            ->line("Ticket #{$this->ticket->id} ({$this->ticket->title}) for machine **{$this->ticket->machine->name}** has been discarded.")
            ->line("This ticket was closed as 'not applicable' or 'duplicate' and no further action will be taken.")
            ->action('View Ticket Details', $url)
            ->line('Thank you for using the TPM application.');
    }

    /**
     * The In-App Notification (toDatabase)
     */
    public function toDatabase($notifiable): array
    {
        return [
            'message' => "Ticket (#{$this->ticket->id}) for {$this->ticket->machine->name} has been discarded.",
            'url' =>  NotificationHelper::route('tickets.show', $this->ticket->id),
            'ticket_id' => $this->ticket->id,
        ];
    }

    /**
     * Data for SharePoint/Teams (toTeamsViaSharePoint)
     */
    public function toTeamsViaSharePoint($notifiable): array
    {
        $ticket = $this->ticket;
        $title = "🗑️ Ticket Discarded: #{$ticket->id}";
        $machine = $ticket->machine->name;
        $issue = $ticket->title;
        $discardedBy = $ticket->updated_by ? $ticket->updated_by->name ?? 'System' : 'System';
        $url =  NotificationHelper::route('tickets.show', $ticket->id);

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
                            'text' => '🗑️ Ticket Discarded',
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
                                    'text' => "A maintenance ticket has been marked as **Discarded** and will not require further action.",
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
                        ['title' => 'Discarded By:', 'value' => $discardedBy],
                    ]
                ],
                // 4. EXTRA MESSAGE
                [
                    'type' => 'TextBlock',
                    'text' => "This ticket was closed as 'Not Applicable' or 'Duplicate'. No additional actions are required from the maintenance team.",
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
