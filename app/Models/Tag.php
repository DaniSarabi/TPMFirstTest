<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

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
     * Get all of the machines that are assigned this tag.
     */
    public function machines(): MorphToMany
    {
        return $this->morphedByMany(Machine::class, 'taggable');
    }

    /**
     * Get all of the assets that are assigned this tag.
     */
    public function assets(): MorphToMany
    {
        return $this->morphedByMany(Asset::class, 'taggable');
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
