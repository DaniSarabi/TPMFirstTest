<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EscalationPolicy extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'is_active']; // Añade 'is_active'

    /**
     * Get the levels for the escalation policy.
     */
    public function levels(): HasMany
    {
        return $this->hasMany(EscalationLevel::class)->orderBy('level');
    }
}
