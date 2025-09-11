<?php

namespace App\Services;

use App\Models\Machine;
use App\Models\Tag;
use App\Models\DowntimeLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use App\Models\Ticket;
use App\Models\ScheduledMaintenance;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TagManagerService
{
    /**
     * ACTION: This method is now simpler. It only applies a tag and logs the event.
     * It no longer triggers the downtime resolver itself.
     */
    public function applyTag(Machine $machine, string $tagSlug, ?Model $source = null): void
    {
        $tag = Tag::where('slug', $tagSlug)->first();
        if (!$tag) return;

        $machine->tags()->syncWithoutDetaching($tag->id);

        if ($source instanceof Ticket) {
            $this->_logTagChange($source, $tag, 'applied');
        }
    }

    /**
     * ACTION: This method is now simpler. It only removes a tag and logs the event.
     */
    public function removeTag(Machine $machine, string $tagSlug, ?Model $source = null): void
    {
        $tag = Tag::where('slug', $tagSlug)->first();
        if (!$tag) return;

        $machine->tags()->detach($tag->id);

        if ($source instanceof Ticket) {
            $this->_logTagChange($source, $tag, 'removed');
        }
    }


    private function _logTagChange(?Model $source, Tag $tag, string $action): void
    {
        if ($source instanceof Ticket) {
            $source->updates()->create([
                'user_id' => Auth::id(),
                'comment' => "System {$action} tag: '{$tag->name}'",
                'action' => $action,
                'loggable_id' => $tag->id,
                'loggable_type' => get_class($tag),
            ]);
        }
    }
}
