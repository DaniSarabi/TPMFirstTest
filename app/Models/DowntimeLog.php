<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class DowntimeLog extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'downtime_logs';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'machine_id',
        'downtimeable_id',   // <-- ACTION: New fillable attribute
        'downtimeable_type', // <-- ACTION: New fillable attribute
        'category',          // <-- ACTION: New fillable attribute
        'start_time',
        'end_time',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    /**
     * Get the machine associated with the downtime log.
     */
    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    /**
     * Get the user who triggered the downtime log.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // /**
    //  * Get the ticket associated with the downtime log.
    //  */
    // public function ticket(): BelongsTo
    // {
    //     return $this->belongsTo(Ticket::class);
    // }

    /**
     * This is the new polymorphic relationship.
     */
    public function downtimeable()
    {
        return $this->morphTo();
    }
}
