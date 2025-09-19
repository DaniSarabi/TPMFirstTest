<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Relations\MorphMany; // Import MorphMany
use Illuminate\Database\Eloquent\Relations\BelongsToMany; // Import BelongsToMany
use Illuminate\Database\Eloquent\Relations\MorphToMany;


class Machine extends Model
{
    //
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'created_by',
        'image_url',
        'status'
    ];

    /**
     * This method will automatically format the image_url whenever it's accessed.
     */
    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                // If the value exists, return the full public URL from storage.
                // Otherwise, return null.
                return $value ? Storage::url($value) : null;
            }
        );
    }

    /**
     * Get the user who created the machine.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the subsystems for the machine.
     */
    public function subsystems(): HasMany
    {
        return $this->hasMany(Subsystem::class);
    }

    /**
     * The tags that belong to the machine.
     */
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }

    /**
     * Get all of the machine's scheduled maintenances.
     * This is the missing relationship method.
     */
    public function scheduledMaintenances(): MorphMany
    {
        return $this->morphMany(ScheduledMaintenance::class, 'schedulable');
    }
    /**
     * Get all of the machine's tickets.
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
    /**
     * Get all of the inspection reports for the machine.
     * This is the missing relationship.
     */
    public function inspectionReports(): HasMany
    {
        return $this->hasMany(InspectionReport::class);
    }
    /**
     * Get the downtime logs for the machine.
     */
    public function downtimeLogs()
    {
        // DowntimeLog model
        return $this->hasMany(DowntimeLog::class);
    }
    /**
     * Get all of the machine's notification preferences.
     * This is the new relationship.
     */
    public function notificationPreferences(): MorphMany
    {
        return $this->morphMany(NotificationPreference::class, 'preferable');
    }
}
