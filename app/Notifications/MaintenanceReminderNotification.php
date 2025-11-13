<?php

namespace App\Notifications;

use App\Models\ScheduledMaintenance;
use App\Models\User;
use App\Broadcasting\SharePointNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MaintenanceReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public ScheduledMaintenance $maintenance;

    /**
     * Create a new notification instance.
     */
    public function __construct(ScheduledMaintenance $maintenance)
    {
        $this->maintenance = $maintenance;
    }

    /**
     * The "Gateway" (Aduana)
     * Filters channels based on user preferences.
     */
    public function via(User $notifiable): array
    {
        $channels = [];
        $machine = $this->maintenance->schedulable_type === 'App\Models\Machine'
            ? $this->maintenance->schedulable
            : $this->maintenance->schedulable->machine;

        $preferences = $notifiable->notificationPreferences
            ->filter(function ($pref) use ($machine) {
                if ($pref->preferable_id === null) return true;
                if ($machine && $pref->preferable_id === $machine->id && $pref->preferable_type === 'App\Models\Machine') return true;
                return false;
            })
            ->pluck('notification_type')
            ->unique();

        if ($preferences->contains('maintenance.reminder.in_App')) $channels[] = 'database';
        if ($preferences->contains('maintenance.reminder.email')) $channels[] = 'mail';
        if ($preferences->contains('maintenance.reminder.teams')) $channels[] = SharePointNotificationChannel::class;

        return $channels;
    }

    /**
     * El Correo (toMail)
     */
    public function toMail($notifiable): MailMessage
    {
        $url = route('maintenance-calendar.index');

        return (new MailMessage)
            ->subject("Maintenance Reminder: {$this->maintenance->title}")
            ->level('primary') // Azul
            ->line("Maintenance Reminder")
            ->greeting('Hello, ' . $notifiable->name . '!')
            ->line("This is a reminder that a scheduled maintenance is approaching its due date:")
            ->line("Task: \"{$this->maintenance->title}\"")
            ->line("Target: \"{$this->maintenance->schedulable->name}\"")
            ->line("Scheduled Date: \"{$this->maintenance->scheduled_date->format('M d, Y')}\"")
            ->line("---")
            ->line('Preparation to have in mind:')
            ->line("Please review the full maintenance plan. Check if this task requires \"equipment downtime\", specific \"tools\", or \"spare parts\".")
            ->line("Ensure all safety procedures are coordinated with the production team in advance.")
            ->action('View Calendar', $url)
            ->salutation('Regards, TPM System'); // --- NUEVO: Un cierre formal
    }

    /**
     * La Notificación In-App (toDatabase)
     */
    public function toDatabase($notifiable): array
    {
        return [
            'message' => "Reminder: '{$this->maintenance->title}' for '{$this->maintenance->schedulable->name}' is due soon.",
            'url' => route('maintenance-calendar.index'),
        ];
    }

    /**
     * Los datos para SharePoint/Teams
     */
    public function toTeamsViaSharePoint($notifiable): array
    {
        $title = "🔔 Maintenance Reminder: {$this->maintenance->title}";
        $task = $this->maintenance->title;
        $target = $this->maintenance->schedulable->name;
        $scheduledDate = $this->maintenance->scheduled_date->format('M d, Y');

        // --- ¡TU IDEA! ---
        // Placeholder con JST en rojo (#dc3545) sobre un círculo azul (#0056b3)
        $logoUrl = "https://placehold.co/600x400/EEE/e3051b?font=lato&text=JST";

        $cardPayload = [
            'type' => 'AdaptiveCard',
            '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
            'version' => '1.5',
            'msteams' => ['width' => 'Full'],
            'body' => [
                // 1. HEADER (Gris/Emphasis, no rojo)
                [
                    'type' => 'Container',
                    'style' => 'emphasis', // Un estilo más neutral
                    'items' => [
                        [
                            'type' => 'TextBlock',
                            'text' => '🔔 Maintenance Reminder',
                            'weight' => 'Bolder',
                            'size' => 'Medium',
                        ]
                    ],
                    'bleed' => true
                ],
                // 2. SECCIÓN DE COLUMNAS (Logo + Texto)
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
                                    'text' => "This is a reminder that a scheduled maintenance is approaching its due date.",
                                    'wrap' => true,
                                    'weight' => 'Bolder'
                                ]
                            ]
                        ]
                    ]
                ],
                // 3. SET DE DATOS
                [
                    'type' => 'FactSet',
                    'facts' => [
                        ['title' => 'Task:', 'value' => $task],
                        ['title' => 'Target:', 'value' => $target],
                        ['title' => 'Scheduled Date:', 'value' => $scheduledDate]
                    ]
                ],
                // 4. El texto de "preparación"
                [
                    'type' => 'TextBlock',
                    'text' => "Please review the plan to confirm if downtime, tools, or spare parts are required. Coordinate with production as needed.",
                    'wrap' => true,
                    'isSubtle' => true,
                ],
                // 5. BOTÓN
                [
                    'type' => 'ActionSet',
                    'actions' => [
                        [
                            'type' => 'Action.OpenUrl',
                            'title' => 'View Maintenance Calendar',
                            'url' => route('maintenance-calendar.index')
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
            // ¡Usamos tu "hack" de usar el campo 'message' de SharePoint!
            'message' => json_encode($cardPayload),
            'userEmail' => $notifiable->email,
        ];
    }
}
