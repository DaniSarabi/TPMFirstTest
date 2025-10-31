<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\NotificationPreference;

/**
 * --- ACTION: Add this docblock to help your code editor ---
 * This tells static analysis tools like Intelephense about the methods
 * provided by the Notifiable and HasRoles traits.
 *
 * @mixin \Illuminate\Notifications\Notifiable
 * @mixin \Spatie\Permission\Traits\HasRoles
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar_url',
        'avatar_color',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    /**
     * Get the in-app notification preferences for the user.
     */
    public function notificationPreferences(): HasMany
    {
        return $this->hasMany(NotificationPreference::class);
    }
    /**
     * Get the tickets created by the user.
     *
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'created_by');
    }
    /**
     * Obtiene todos los adjuntos subidos por este usuario.
     * Nota: especificamos la llave foránea 'uploaded_by'
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(TicketAttachment::class, 'uploaded_by');
    }
}
