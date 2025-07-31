<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class InspectionPoint extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'subsystem_id',
        'name',
        'description',
    ];

    /**
     * Get the subsystem that this inspection point belongs to.
     */
    public function subsystem(): BelongsTo
    {
        return $this->belongsTo(Subsystem::class);
    }
}
