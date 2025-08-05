<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Behavior extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'title',
        'description',
        'scope',
    ];

    /**
     * The inspection statuses that have this behavior.
     */
    public function inspectionStatuses(): BelongsToMany
    {
        return $this->belongsToMany(InspectionStatus::class, 'inspection_status_has_behaviors');
    }

    /**
     * The ticket statuses that have this behavior.
     */
    public function ticketStatuses(): BelongsToMany
    {
        return $this->belongsToMany(TicketStatus::class, 'ticket_status_has_behaviors');
    }
}
