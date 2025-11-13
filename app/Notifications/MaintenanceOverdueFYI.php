<?php

namespace App\Notifications;

use App\Models\ScheduledMaintenance;
use App\Models\User;
use App\Broadcasting\SharePointNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MaintenanceOverdueFYI extends Notification implements ShouldQueue
{
    use Queueable;

    public ScheduledMaintenance $maintenance;
    public string $escalationMessage; // El mensaje dinámico que pediste

    /**
     * Create a new notification instance.
     */
    public function __construct(ScheduledMaintenance $maintenance, string $escalationMessage)
    {
        $this->maintenance = $maintenance;
        $this->escalationMessage = $escalationMessage;
    }

    /**
     * La "Aduana" - Revisa las preferencias del TÉCNICO
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

        if ($preferences->contains('maintenance.overdue.in_app')) $channels[] = 'database';
        if ($preferences->contains('maintenance.overdue.email')) $channels[] = 'mail';
        if ($preferences->contains('maintenance.overdue.teams')) $channels[] = SharePointNotificationChannel::class;

        return $channels;
    }

    /**
     * El Correo (toMail) - Mensaje FYI
     */
    public function toMail($notifiable): MailMessage
    {
        $url = route('maintenance-calendar.index');

        return (new MailMessage)
            ->subject("FYI: Maintenance Overdue - {$this->maintenance->title}")
            ->level('error') // Rojo, pero menos agresivo
            ->line("Maintenance Overdue (FYI)")
            ->greeting('Hello, ' . $notifiable->name . '.')
            ->line("This is an update on the overdue maintenance task: **{$this->maintenance->title}**.")
            ->line("Target: **{$this->maintenance->schedulable->name}**.")
            ->line("**Escalation Status:** {$this->escalationMessage}") // ¡El mensaje dinámico!
            ->action('View Calendar', $url);
    }

    /**
     * La Notificación In-App (toDatabase)
     */
    public function toDatabase($notifiable): array
    {
        return [
            'message' => "🔥 OVERDUE: '{$this->maintenance->title}'. Status: {$this->escalationMessage}",
            'url' => route('maintenance-calendar.index'),
        ];
    }

    /**
     * Los datos para SharePoint/Teams
     */
    public function toTeamsViaSharePoint($notifiable): array
    {

        $title = "FYI: Maintenance Overdue - {$this->maintenance->title}";
        $task = $this->maintenance->title;
        $target = $this->maintenance->schedulable->name;
        $dueDate = $this->maintenance->scheduled_date->format('M d, Y');

        // El logo placeholder (JST en rojo sobre azul)
        $logoUrl = "https://placehold.co/100x100/0056b3/dc3545.png?text=JST&font=arial";

        $cardPayload = [
            'type' => 'AdaptiveCard',
            '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
            'version' => '1.5',
            'msteams' => ['width' => 'Full'],
            'body' => [
                // 1. HEADER (Gris/Emphasis)
                [
                    'type' => 'Container',
                    'style' => 'emphasis', // Estilo neutral
                    'items' => [
                        [
                            'type' => 'TextBlock',
                            'text' => '🔔 FYI: Maintenance Overdue',
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
                                    'text' => "This is an update on the overdue maintenance task: **{$task}**.",
                                    'wrap' => true,
                                    'weight' => 'Bolder'
                                ]
                            ]
                        ]
                    ]
                ],
                // 3. SET DE DATOS (El Resumen)
                [
                    'type' => 'FactSet',
                    'facts' => [
                        ['title' => 'Target:', 'value' => $target],
                        ['title' => 'Original Due Date:', 'value' => $dueDate]
                    ]
                ],
                // 4. ¡EL MENSAJE DINÁMICO QUE PEDISTE!
                [
                    'type' => 'Container',
                    'style' => 'warning', // Fondo amarillo sutil
                    'items' => [
                        [
                            'type' => 'TextBlock',
                            'text' => "**Escalation Status:** {$this->escalationMessage}",
                            'wrap' => true
                        ]
                    ],
                    'bleed' => true
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
            'message' => json_encode($cardPayload), // Pasamos el JSON
            'userEmail' => $notifiable->email,
        ];
    }
}
