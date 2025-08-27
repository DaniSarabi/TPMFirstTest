<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaintenanceReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'scheduled_maintenance_id',
        'user_id',
        'notes',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    /**
     * Get the scheduled maintenance event that this report belongs to.
     */
    public function scheduledMaintenance(): BelongsTo
    {
        return $this->belongsTo(ScheduledMaintenance::class);
    }

    /**
     * Get the user who performed the maintenance.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all of the detailed results for this report.
     */
    public function results(): HasMany
    {
        return $this->hasMany(MaintenanceReportResult::class);
    }
}
