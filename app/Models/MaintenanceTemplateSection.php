<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaintenanceTemplateSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'maintenance_template_id',
        'title',
        'description',
        'order',
    ];

    /**
     * Una sección pertenece a una plantilla de mantenimiento.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(MaintenanceTemplate::class, 'maintenance_template_id');
    }

    /**
     * Una sección tiene muchas tareas.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(MaintenanceTemplateTask::class, 'section_id')->orderBy('order');
    }
}
