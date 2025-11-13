<?php

namespace App\Notifications;

use App\Models\InspectionReport;
use App\Models\User;
use App\Broadcasting\SharePointNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InspectionCompletedNotification extends Notification implements ShouldQueue
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

        if ($preferences->contains('inspection.completed.in_app')) $channels[] = 'database';
        if ($preferences->contains('inspection.completed.email')) $channels[] = 'mail';
        if ($preferences->contains('inspection.completed.teams')) $channels[] = SharePointNotificationChannel::class;

        return $channels;
    }

    /**
     * El Correo (toMail)
     */
    public function toMail($notifiable): MailMessage
    {
        $url = route('inspections.show', $this->report->id);
        $duration = $this->report->completed_at->diffForHumans($this->report->created_at, true); // Calculamos duración

        return (new MailMessage)
            ->subject("Inspection Completed: {$this->report->machine->name}")
            ->level('success') // ¡Verde!
            ->line("Inspection Completed")
            ->greeting('Hello, ' . $notifiable->name . '!')
            ->line("The inspection for **{$this->report->machine->name}** was completed successfully by **{$this->report->user->name}**.")
            ->line("Duration: **{$duration}**.")
            ->line("Result: **{$this->statusCounts['OK']} OK** / **{$this->statusCounts['Warning']} Warning** / **{$this->statusCounts['Critical']} Critical**.") // 4. ¡Resumen!
            ->line("No issues were reported.")
            ->action('View Full Report', $url);
    }

    /**
     * La Notificación In-App (toDatabase)
     */
    public function toDatabase($notifiable): array
    {
        return [
            'message' => "Inspection completed for {$this->report->machine->name} (No issues found).",
            'url' => route('inspections.show', $this->report->id),
        ];
    }

    /**
     * Los datos para SharePoint/Teams
     */
    public function toTeamsViaSharePoint($notifiable): array
    {
        $title = "✅ Inspection Completed: {$this->report->machine->name}";
        $duration = $this->report->completed_at->diffForHumans($this->report->created_at, true);

        // El logo placeholder (JST en rojo sobre azul)
        // $logoUrl = "https://placehold.co/600x400/EEE/e3051b?font=lato&text=JST";

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
                            'text' => '✅ Inspection Completed',
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
                                    'text' => "The inspection for **{$this->report->machine->name}** was completed by **{$this->report->user->name}**.",
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
                            'url' => route('inspections.show', $this->report->id)
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
