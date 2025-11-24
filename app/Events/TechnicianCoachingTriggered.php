<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Ticket;

class TechnicianCoachingTriggered
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Ticket $ticket;
    public string $insight;

    /**
     * Create a new event instance.
     */
    public function __construct(Ticket $ticket, string $insight)
    {
        $this->ticket = $ticket;
        $this->insight = $insight;
    }
    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('channel-name'),
        ];
    }
}
