<?php

namespace App\Notifications;

use App\Models\ScheduledMaintenance;
use App\Broadcasting\SharePointNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Helpers\NotificationHelper; 

class MaintenanceOverdueEscalation extends Notification implements ShouldQueue
{
    use Queueable;

    public ScheduledMaintenance $maintenance;
    public int $daysOverdue;

    /**
     * Create a new notification instance.
     */
    public function __construct(ScheduledMaintenance $maintenance, int $daysOverdue)
    {
        $this->maintenance = $maintenance;
        $this->daysOverdue = $daysOverdue;
    }

    /**
     * Esta "Carta" es "forzosa" - siempre va por Email y Teams.
     * Se salta la "aduana" (via()) porque usamos Notification::route().
     */
    public function via($notifiable): array
    {
        // Nota: 'mail' se activa con Notification::route('mail', ...)
        // 'teams' se activará manualmente en el listener
        return ['mail'];
    }

    /**
     * El Correo (toMail) - Mensaje URGENTE
     */
    public function toMail($notifiable): MailMessage
    {
        $url =  NotificationHelper::route('maintenance-calendar.index');

        return (new MailMessage)
            ->subject("🔥 ESCALATION: Maintenance Overdue for {$this->daysOverdue} days")
            ->level('error') // ¡Rojo!
            ->line("URGENT: Maintenance Overdue")
            ->greeting('Escalation Alert,')
            ->line("A critical maintenance task is now **{$this->daysOverdue} days overdue** and requires immediate attention.")
            ->line("Task: **{$this->maintenance->title}**")
            ->line("Target: **{$this->maintenance->schedulable->name}**")
            ->line("Original Due Date: **{$this->maintenance->scheduled_date->format('M d, Y')}**")
            ->action('View Maintenance Calendar', $url);
    }

    /**
     * Los datos para SharePoint/Teams
     */
    public function toTeamsViaSharePoint($notifiable): array
    {
        $title = "🔥 ESCALATION: Maintenance Overdue ({$this->daysOverdue} days)";
        $task = $this->maintenance->title;
        $target = $this->maintenance->schedulable->name;
        $dueDate = $this->maintenance->scheduled_date->format('M d, Y');

        // $logoUrl = "https://content.energage.com/company-images/90294/logo.png";

        $cardPayload = [
            'type' => 'AdaptiveCard',
            '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
            'version' => '1.5',
            'msteams' => ['width' => 'Full'], // Ocupa todo el ancho
            'body' => [
                // 1. HEADER ROJO
                [
                    'type' => 'Container',
                    'style' => 'attention', // ¡Estilo rojo de alerta!
                    'items' => [
                        [
                            'type' => 'TextBlock',
                            'text' => '🔥 URGENT: Maintenance Escalation',
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
                            'width' => 'stretch', // Ocupa el resto
                            'items' => [
                                [
                                    'type' => 'TextBlock',
                                    'text' => "A critical maintenance task is now **{$this->daysOverdue} days overdue** and requires immediate attention.",
                                    'wrap' => true,
                                    'weight' => 'Bolder'
                                ]
                            ]
                        ]
                    ]
                ],
                // 3. SET DE DATOS (Se queda igual, es muy limpio)
                [
                    'type' => 'FactSet',
                    'facts' => [
                        ['title' => 'Task:', 'value' => $task],
                        ['title' => 'Target:', 'value' => $target],
                        ['title' => 'Original Due Date:', 'value' => $dueDate]
                    ]
                ],
                // 4. BOTÓN (Se queda igual)
                [
                    'type' => 'ActionSet',
                    'actions' => [
                        [
                            'type' => 'Action.OpenUrl',
                            'title' => 'View Maintenance Calendar',
                            'url' =>  NotificationHelper::route('maintenance-calendar.index')
                        ]
                    ]
                ],
                // 5. FOOTER (Tu texto de "auto-generated")
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
            'title' => "🔥 ESCALATION: Maintenance Overdue ({$this->daysOverdue} days)",
            'message' => json_encode($cardPayload),
            'userEmail' => $notifiable->email, // Aquí $notifiable es el EmailContact
        ];
    }
}
