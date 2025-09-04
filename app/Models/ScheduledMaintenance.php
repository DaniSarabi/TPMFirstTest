<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ScheduledMaintenance extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'maintenance_template_id',
        'schedulable_id',
        'schedulable_type',
        'scheduled_date',
        'status',
        'grace_period_days',
        'reminder_days_before',
        'title',
        'color',
        'series_id',
        'reminder_sent_at'
    ];

    /**
     * The attributes that should be cast.
     * This ensures 'scheduled_date' is always a Carbon date object.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'scheduled_date' => 'date',
    ];

    /**
     * Get the parent schedulable model (Machine or Subsystem).
     * This is the polymorphic relationship definition.
     */
    public function schedulable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the maintenance template associated with this schedule.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(MaintenanceTemplate::class, 'maintenance_template_id');
    }
    /**
     * Get the maintenance report associated with this scheduled event.
     */
    public function report(): HasOne
    {
        return $this->hasOne(MaintenanceReport::class);
    }
    /**
     * Get all of the maintenance schedule's downtime logs.
     */
    public function downtimeLogs(): MorphMany
    {
        return $this->morphMany(DowntimeLog::class, 'downtimeable');
    }
}
