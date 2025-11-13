<?php

namespace App\Events;

use App\Models\ScheduledMaintenance;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MaintenanceBecameOverdue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ScheduledMaintenance $maintenance;

    /**
     * Create a new event instance.
     */
    public function __construct(ScheduledMaintenance $maintenance)
    {
        $this->maintenance = $maintenance;
    }
}
