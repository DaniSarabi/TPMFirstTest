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
     * Get the tasks associated with the maintenance template.
     *
     * This defines a one-to-many relationship. A template has many tasks.
     * We are also ordering them by the 'order' column by default,
     * which will be essential for displaying them correctly in the UI.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(MaintenanceTemplateTask::class)->orderBy('order');
    }
}
