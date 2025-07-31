<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;


class InspectionStatus extends Model
{
    //
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'inspection_statuses';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'severity',
        'auto_creates_ticket',
        'machine_status_id', // Changed from sets_machine_status_to
        'bg_color',
        'text_color',
        'is_default',
    ];

    /**
     * The behaviors that belong to the inspection status.
     */
    public function behaviors(): BelongsToMany
    {
        return $this->belongsToMany(Behavior::class, 'inspection_status_has_behaviors')
            ->withPivot('machine_status_id'); // Important for accessing the extra pivot column
    }
}
