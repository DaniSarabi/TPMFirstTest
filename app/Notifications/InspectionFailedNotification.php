<?php

namespace App\Notifications;

use App\Models\InspectionReport;
use App\Models\User;
use App\Broadcasting\SharePointNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Helpers\NotificationHelper; 

class InspectionFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public InspectionReport $report;
    public array $statusCounts;
    public function __construct(InspectionReport $report, array $statusCounts)
    {
        $this->report = $report;
        $this->statusCounts = $statusCounts;
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
                if ($pref->preferable_id === $this->report->machine_id && $pref->preferable_type === 'App\Models\Machine') return true;
                return false;
            })
            ->pluck('notification_type')
            ->unique();

        if ($preferences->contains('inspection.failed.in_app')) $channels[] = 'database';
        if ($preferences->contains('inspection.failed.email')) $channels[] = 'mail';
        if ($preferences->contains('inspection.failed.teams')) $channels[] = SharePointNotificationChannel::class;

        return $channels;
    }

    /**
     * El Correo (toMail)
     */
    public function toMail($notifiable): MailMessage
    {
        $url =  NotificationHelper::route('inspections.show', $this->report->id);
        $duration = $this->report->completed_at->diffForHumans($this->report->created_at, true);

        return (new MailMessage)
            ->subject("Inspection FAILED: {$this->report->machine->name}")
            ->level('error') // ¡Rojo!
            ->line("Inspection Failed: Faults Reported")
            ->greeting('Hello, ' . $notifiable->name . '!')
            ->line("The inspection for \"{$this->report->machine->name}\" completed by *{$this->report->user->name}* has reported \"new faults\".")
            ->line("Duration: \"{$duration}\".")
            ->line("Summary: \"{$this->statusCounts['OK']} OK\" / \"{$this->statusCounts['Warning']} Warning\" / \"{$this->statusCounts['Critical']} Critical\".")
            ->line("Please review the report immediately to assess the issues and create tickets if necessary.")
            ->action('View Full Report', $url);
    }

    /**
     * La Notificación In-App (toDatabase)
     */
    public function toDatabase($notifiable): array
    {
        return [
            'message' => "Inspection for {$this->report->machine->name} completed with reported faults.",
            'url' =>  NotificationHelper::route('inspections.show', $this->report->id),
        ];
    }

    /**
     * Los datos para SharePoint/Teams
     */
    public function toTeamsViaSharePoint($notifiable): array
    {
        $title = "❌ Inspection FAILED: {$this->report->machine->name}";
        $duration = $this->report->completed_at->diffForHumans($this->report->created_at, true);

        // El logo placeholder (JST en rojo sobre azul)
        // $logoUrl = "https://placehold.co/600x400/EEE/e3051b?font=lato&text=JST";

        $cardPayload = [
            'type' => 'AdaptiveCard',
            '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
            'version' => '1.5',
            'msteams' => ['width' => 'Full'],
            'body' => [
                // 1. HEADER (Rojo/Attention)
                [
                    'type' => 'Container',
                    'style' => 'attention', // ¡Estilo rojo de falla!
                    'items' => [
                        [
                            'type' => 'TextBlock',
                            'text' => '❌ Inspection Failed: Faults Reported',
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
                                    'text' => "The inspection for **{$this->report->machine->name}** (completed by **{$this->report->user->name}**) has reported **new faults**.",
                                    'wrap' => true,
                                    'weight' => 'Bolder'
                                ]
                            ]
                        ]
                    ]
                ],
                // 3. SET DE DATOS (El Resumen que pediste)
                [
                    'type' => 'FactSet',
                    'facts' => [
                        ['title' => 'Duration:', 'value' => $duration],
                        ['title' => 'Result:', 'value' => "{$this->statusCounts['OK']} OK / {$this->statusCounts['Warning']} Warning / {$this->statusCounts['Critical']} Critical"]
                    ]
                ],
                // 4. BOTÓN
                [
                    'type' => 'ActionSet',
                    'actions' => [
                        [
                            'type' => 'Action.OpenUrl',
                            'title' => 'View Full Report',
                            'url' =>  NotificationHelper::route('inspections.show', $this->report->id)
                        ]
                    ]
                ],
                // 5. FOOTER
                [
                    'type' => 'TextBlock',
                    'text' => "This is an automated notification from the TPM APP. If you have any questions, contact your system administrator.",
                    'wrap' => true,
                    'size' => 'Small',
                    'isSubtle' => true,
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
