<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Subsystem extends Model
{
    //
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'machine_id',
        'name',
        'description',
    ];

    /**
     * Get the machine that the subsystem belongs to.
     */
    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    /**
     * Get the inspection points for the subsystem.
     */
    public function inspectionPoints(): HasMany
    {
        return $this->hasMany(InspectionPoint::class);
    }
    /**
     * Get all of the subsystem's scheduled maintenances.
     * This is the missing relationship method.
     */
    public function scheduledMaintenances(): MorphMany
    {
        return $this->morphMany(ScheduledMaintenance::class, 'schedulable');
    }
}
