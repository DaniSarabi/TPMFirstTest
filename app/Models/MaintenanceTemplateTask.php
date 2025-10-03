<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceTemplateTask extends Model
{
    use HasFactory;

    /**
     * Se actualiza 'fillable' para incluir el nuevo campo opcional 'section_id'.
     */
    protected $fillable = [
        'maintenance_template_id',
        'section_id', // <-- Campo añadido
        'order',
        'task_type',
        'label',
        'description',
        'options',
    ];

    protected $casts = [
        'options' => 'array',
    ];

    /**
     * Una tarea siempre pertenece a una plantilla. (Se mantiene)
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(MaintenanceTemplate::class);
    }

    /**
     * ACTION: Una tarea AHORA PUEDE pertenecer a una sección.
     * Esta relación es opcional (`section_id` puede ser null).
     */
    public function section(): BelongsTo
    {
        return $this->belongsTo(MaintenanceTemplateSection::class);
    }
}
