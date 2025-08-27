<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaintenanceReportResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'maintenance_report_id',
        'task_label',
        'result',
        'comment',
        //'photo_url',
    ];

    protected $casts = [
        'result' => 'json',
    ];

    /**
     * Get the parent maintenance report that this result belongs to.
     */
    public function report(): BelongsTo
    {
        return $this->belongsTo(MaintenanceReport::class, 'maintenance_report_id');
    }
    /**
     * Get all of the photos for this result.
     */
    public function photos(): HasMany
    {
        return $this->hasMany(MaintenancePhoto::class);
    }
}
