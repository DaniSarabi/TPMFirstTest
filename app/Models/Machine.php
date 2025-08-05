<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

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
        'machine_status_id', // Use the new foreign key
        'image_url',
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
     * The "booted" method of the model.
     *
     * This is the perfect place to register model events.
     */
    protected static function booted(): void
    {
        // --- ACTION: Add the 'created' event listener ---
        // This will automatically run every time a new machine is created.
        static::created(function (Machine $machine) {
            $machine->statusLogs()->create([
                'machine_status_id' => $machine->machine_status_id,
            ]);
        });
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
     * Get the status logs for the machine.
     */
    public function statusLogs(): HasMany
    {
        return $this->hasMany(MachineStatusLog::class);
    }

    /**
     * Get the status for the machine.
     * This is the relationship method that was missing.
     */
    public function machineStatus(): BelongsTo
    {
        return $this->belongsTo(MachineStatus::class);
    }
}
