<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Tag extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'color',
        'icon',
    ];

    /**
     * The machines that have this tag.
     */
    public function machines(): BelongsToMany
    {
        return $this->belongsToMany(Machine::class);
    }
     /**
     * ACTION: This new relationship allows a Tag to find all the timeline
     * events that it has been a part of.
     */
    public function ticketUpdates(): MorphMany
    {
        return $this->morphMany(TicketUpdate::class, 'loggable');
    }
}
