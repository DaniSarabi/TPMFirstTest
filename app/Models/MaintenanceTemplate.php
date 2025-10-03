<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;


class MaintenanceTemplate extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'category',
        'description',
    ];

    /**
     * Una plantilla ahora tiene muchas secciones.
     */
    public function sections(): HasMany
    {
        return $this->hasMany(MaintenanceTemplateSection::class)->orderBy('order');
    }

    /**
     * ACTION: Se modifica la relación 'tasks' para que ahora solo devuelva
     * las tareas "raíz" (aquellas cuyo section_id es NULL).
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(MaintenanceTemplateTask::class)->whereNull('section_id')->orderBy('order');
    }
}
