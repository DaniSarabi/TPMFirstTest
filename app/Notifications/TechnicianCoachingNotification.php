<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\User;
use App\Broadcasting\SharePointNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TechnicianCoachingNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Ticket $ticket;
    public string $insight;

    public function __construct(Ticket $ticket, string $insight)
    {
        $this->ticket = $ticket;
        $this->insight = $insight;
    }

    /**
     * La Aduana
     */
    public function via(User $notifiable): array
    {
        $channels = [];
        // Filtramos las preferencias globales (coaching suele ser personal, no por máquina)
        $preferences = $notifiable->notificationPreferences
            ->filter(fn($pref) => $pref->preferable_id === null)
            ->pluck('notification_type')
            ->unique();

        if ($preferences->contains('technician.coaching.in_app')) $channels[] = 'database';
        if ($preferences->contains('technician.coaching.email')) $channels[] = 'mail';
        if ($preferences->contains('technician.coaching.teams')) $channels[] = SharePointNotificationChannel::class;

        return $channels;
    }

    /**
     * Email: Tono educativo
     */
    public function toMail($notifiable): MailMessage
    {
        $url = route('tickets.show', $this->ticket->id);

        return (new MailMessage)
            ->subject("💡 Coaching Tip: Ticket #{$this->ticket->id}")
            ->level('primary') // Azul
            ->line("TPM Coaching Tip")
            ->greeting('Hello, ' . $notifiable->name . '!')
            ->line("The AI system has analyzed your recent ticket **#{$this->ticket->id}** ({$this->ticket->title}) and has a suggestion to improve future reports:")
            ->line("---")
            ->line("**Suggestion:** {$this->insight}")
            ->line("---")
            ->line("Accurate reporting helps us prevent future failures. Keep up the good work!")
            ->action('Review Ticket', $url);
    }

    /**
     * In-App
     */
    public function toDatabase($notifiable): array
    {
        return [
            'message' => "💡 AI Suggestion for Ticket #{$this->ticket->id}: {$this->insight}",
            'url' => route('tickets.show', $this->ticket->id),
            'ticket_id' => $this->ticket->id,
        ];
    }

    /**
     * Teams: Adaptive Card estilo "Tip"
     */
    public function toTeamsViaSharePoint($notifiable): array
    {
        $title = "💡 Coaching Opportunity: Ticket #{$this->ticket->id}";
        // Icono de foco/idea
        $logoUrl = "https://placehold.co/100x100/FFC107/ffffff.png?text=TIP&font=arial";

        $cardPayload = [
            'type' => 'AdaptiveCard',
            '$schema' => 'http://adaptivecards.io/schemas/adaptive-card.json',
            'version' => '1.5',
            'body' => [
                ['type' => 'Container', 'style' => 'emphasis', 'items' => [
                    ['type' => 'TextBlock', 'text' => '💡 Coaching Opportunity', 'weight' => 'Bolder', 'size' => 'Medium', 'color' => 'Accent']
                ], 'bleed' => true],

                ['type' => 'ColumnSet', 'columns' => [
                    ['type' => 'Column', 'width' => 'auto', 'items' => [['type' => 'Image', 'url' => $logoUrl, 'size' => 'small', 'style' => 'person']]],
                    ['type' => 'Column', 'width' => 'stretch', 'items' => [
                        ['type' => 'TextBlock', 'text' => "Regarding Ticket: **{$this->ticket->title}**", 'wrap' => true, 'weight' => 'Bolder'],
                        ['type' => 'TextBlock', 'text' => "Machine: {$this->ticket->machine->name}", 'wrap' => true, 'isSubtle' => true, 'size' => 'Small']
                    ]]
                ]],

                ['type' => 'Container', 'style' => 'good', 'items' => [ // Fondo verde claro/positivo
                    ['type' => 'TextBlock', 'text' => "**AI Suggestion:**", 'wrap' => true],
                    ['type' => 'TextBlock', 'text' => $this->insight, 'wrap' => true, 'isSubtle' => true]
                ]],

                ['type' => 'ActionSet', 'actions' => [['type' => 'Action.OpenUrl', 'title' => 'Review Ticket', 'url' => route('tickets.show', $this->ticket->id)]]]
            ]
        ];

        return [
            'title' => $title,
            'message' => json_encode($cardPayload),
            'userEmail' => $notifiable->email,
        ];
    }
}
