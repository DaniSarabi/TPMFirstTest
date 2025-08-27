<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Storage;

class MaintenancePhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'maintenance_report_result_id',
        'photo_url',
    ];

    /**
     * Get the parent result that this photo belongs to.
     */
    public function result(): BelongsTo
    {
        return $this->belongsTo(MaintenanceReportResult::class, 'maintenance_report_result_id');
    }
    /**
     * Accessor to automatically get the full, public URL for the photo.
     *
     * This method will now be used automatically whenever you access the 'photo_url' attribute.
     * It checks if a value exists and, if so, prepends the correct public storage path.
     */
    protected function photoUrl(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? Storage::url($value) : null,
        );
    }
}
