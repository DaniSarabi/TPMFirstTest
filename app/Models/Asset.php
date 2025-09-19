<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Asset extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'asset_group_id',
        'name',
        'slug',
        'status',
        'image_url',
    ];

    /**
     * This method will automatically format the image_url whenever it's accessed.
     */
    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: fn($value) => $value ? Storage::url($value) : null
        );
    }

    /**
     * Get the asset group that owns the asset.
     */
    public function assetGroup(): BelongsTo
    {
        return $this->belongsTo(AssetGroup::class);
    }

    /**
     * Get all of the tags for the asset.
     */
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }

    /**
     * Get all of the asset's scheduled maintenances.
     */
    public function scheduledMaintenances(): MorphMany
    {
        return $this->morphMany(ScheduledMaintenance::class, 'schedulable');
    }
}
