<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class EscalationLevel extends Model
{
    use HasFactory;

    protected $fillable = ['escalation_policy_id', 'level', 'days_after'];

    /**
     * Get the policy that owns the level.
     */
    public function policy(): BelongsTo
    {
        return $this->belongsTo(EscalationPolicy::class, 'escalation_policy_id');
    }

    /**
     * The email contacts that belong to the level.
     */
    public function emailContacts(): BelongsToMany
    {
        return $this->belongsToMany(EmailContact::class, 'escalation_level_email_contact');
    }
}
