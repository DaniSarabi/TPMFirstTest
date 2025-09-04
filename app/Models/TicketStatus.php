<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TicketStatus extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ticket_statuses';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'bg_color',
        'text_color',
    ];

    /**
     * The behaviors that belong to the ticket status.
     */
    public function behaviors(): BelongsToMany
    {
          return $this->belongsToMany(Behavior::class, 'ticket_status_has_behaviors')
            ->withPivot('tag_id');
    }

    /**
     * Get the tickets that have this status.
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
}
