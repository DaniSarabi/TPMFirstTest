<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceTemplateTask extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'maintenance_template_id',
        'order',
        'task_type',
        'label',
        'description',
        'options',
    ];

    /**
     * The attributes that should be cast.
     *
     * This tells Laravel to automatically decode the 'options' JSON column
     * into a PHP array whenever we access it, and encode it back to JSON
     * when we save it. This is incredibly useful.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'options' => 'array',
    ];

    /**
     * Get the template that this task belongs to.
     *
     * This defines the inverse of the one-to-many relationship.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(MaintenanceTemplate::class);
    }
}
