<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MachineStatus extends Model
{
    //
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'bg_color',
        'text_color',
        'description',
        'is_protected',
        'is_operational_default',
    ];

    /**
     * Get the machines that have this status.
     */
    public function machines(): HasMany
    {
        return $this->hasMany(Machine::class);
    }
}
