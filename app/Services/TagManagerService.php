<?php

namespace App\Services;

use App\Models\Machine;
use App\Models\Tag;
use App\Models\DowntimeLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\Ticket;


class TagManagerService
{
    /**
     * Applies a tag to a machine and updates the machine's status and downtime log.
     * ACTION: This method now accepts an optional 'source' model (e.g., a Ticket).
     */
    public function applyTag(Machine $machine, string $tagSlug, ?Model $source = null): void
    {
        $tag = Tag::where('slug', $tagSlug)->first();

        if (!$tag) {
            Log::warning("TagManagerService: Attempted to apply non-existent tag '{$tagSlug}' to machine #{$machine->id}.");
            return;
        }

        $machine->tags()->syncWithoutDetaching($tag->id);

        // ACTION: Log this event on the ticket's timeline.
        if ($source instanceof Ticket) {
            $source->updates()->create([
                'user_id' => auth::id(),
                'comment' => "System applied tag: '{$tag->name}'",
                'action' => 'applied',
                'loggable_id' => $tag->id,
                'loggable_type' => get_class($tag),
            ]);
        }

        // Pass the source of the change to the gatekeeper method.
        $this->syncStatus($machine, $source);
    }

    /**
     * Removes a tag from a machine and updates the machine's status and downtime log.
     * ACTION: This method now accepts an optional 'source' model.
     */
    public function removeTag(Machine $machine, string $tagSlug, ?Model $source = null): void
    {
        $tag = Tag::where('slug', $tagSlug)->first();

        if ($tag) {
            $machine->tags()->detach($tag->id);

            // ACTION: Log this event on the ticket's timeline.
            if ($source instanceof Ticket) {
                $source->updates()->create([
                    'user_id' => auth::id(),
                    'comment' => "System removed tag: '{$tag->name}'",
                    'action' => 'removed',
                    'loggable_id' => $tag->id,
                    'loggable_type' => get_class($tag),
                ]);
            }
        }

        $this->syncStatus($machine, $source);
    }

    /**
     * ACTION: This is the new, central method for starting all downtime logs.
     */
    public function startDowntime(Machine $machine, string $category, ?Model $source = null): void
    {
        // First, ensure any other open downtime log is stopped to prevent overlaps.
        $this->stopDowntime($machine);

        DowntimeLog::create([
            'machine_id' => $machine->id,
            'category' => $category,
            'downtimeable_id' => $source ? $source->id : null,
            'downtimeable_type' => $source ? get_class($source) : null,
            'start_time' => now(),
        ]);
    }

    /**
     * ACTION: This is the new, central method for stopping all downtime logs.
     */
    public function stopDowntime(Machine $machine): void
    {
        DowntimeLog::where('machine_id', $machine->id)
            ->whereNull('end_time')
            ->update(['end_time' => now()]);
    }

    /**
     * ACTION: This is the completely refactored "gatekeeper" method.
     * It is the single source of truth for a machine's status.
     */
    private function syncStatus(Machine $machine, ?Model $source): void
    {
        $machine->load('tags'); // Ensure we have the latest tags.

        $isOutOfService = $machine->tags->contains('slug', 'out-of-service');
        $isAwaitingParts = $machine->tags->contains('slug', 'awaiting-parts');

        if ($isOutOfService) {
            // Only act if the status is not already 'OUT_OF_SERVICE' to prevent duplicate actions.
            if ($machine->status !== 'out_of_service') {
                $machine->update(['status' => 'out_of_service']);

                // This is the "smart" logic: determine the downtime category based on other tags.
                $category = $isAwaitingParts ? 'Awaiting Parts' : 'Corrective';
                $this->startDowntime($machine, $category, $source);
            }
        } else {
            // If the 'out-of-service' tag is gone, the machine should be operational.
            if ($machine->status !== 'operational') {
                $machine->update(['status' => 'operational']);
                $this->stopDowntime($machine);
            }
        }
    }
}
