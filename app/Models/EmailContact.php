<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class EmailContact extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'email_contacts';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'department',
    ];
     /**
     * The escalation levels that the contact is a part of.
     */
    public function escalationLevels(): BelongsToMany
    {
        return $this->belongsToMany(EscalationLevel::class, 'escalation_level_email_contact');
    }
}
