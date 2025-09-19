<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class AssetGroup extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'maintenance_type'];

    /**
     * Get all of the machines for the AssetGroup.
     */
    public function machines(): HasMany
    {
        return $this->hasMany(Machine::class);
    }

    /**
     * Get all of the assets for the AssetGroup.
     */
    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class);
    }

    /**
     * Get all of the group's scheduled maintenances.
     * This is used when maintenance_type is 'group'.
     */
    public function scheduledMaintenances(): MorphMany
    {
        return $this->morphMany(ScheduledMaintenance::class, 'schedulable');
    }
}
