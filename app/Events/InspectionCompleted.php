<?php

namespace App\Events;

use App\Models\InspectionReport;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InspectionCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The InspectionReport instance.
     *
     * @var \App\Models\InspectionReport
     */

    /**
     * Create a new event instance.
     */
    public function __construct(public InspectionReport $inspectionReport)
    {
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
