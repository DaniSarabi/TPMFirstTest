<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TicketUpdate extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ticket_updates';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'ticket_id',
        'user_id',
        'comment',
        'action_taken',
        'parts_used',
        'category',
        'old_status_id',
        'new_status_id',
        'loggable_id',
        'loggable_type',
        'action',
    ];

    /**
     * Get the ticket that this update belongs to.
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * Get the user who made this update.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the old status for this update.
     */
    public function oldStatus(): BelongsTo
    {
        return $this->belongsTo(TicketStatus::class, 'old_status_id');
    }

    /**
     * Get the new status for this update.
     */
    public function newStatus(): BelongsTo
    {
        return $this->belongsTo(TicketStatus::class, 'new_status_id');
    }

    /**
     * ACTION: The old 'newMachineStatus()' relationship has been removed.
     */
    // public function newMachineStatus(): BelongsTo ... (REMOVED)

    /**
     * ACTION: The new polymorphic 'loggable' relationship has been added.
     * This allows a timeline event to be associated with any other model,
     * such as a Tag.
     */
    public function loggable()
    {
        return $this->morphTo();
    }
    /**
     * ACTION: The new relationship to get all photos for this update.
     * This defines the "one-to-many" relationship.
     */
    public function photos(): HasMany
    {
        return $this->hasMany(TicketUpdatePhoto::class);
    }
}
