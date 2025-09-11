<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute; // ACTION: Import the Attribute class
use Illuminate\Support\Facades\Storage; // ACTION: Import the Storage facade

class TicketUpdatePhoto extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ticket_update_photos';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'ticket_update_id',
        'photo_url',
    ];

    /**
     * Get the ticket update that this photo belongs to.
     */
    public function ticketUpdate(): BelongsTo
    {
        return $this->belongsTo(TicketUpdate::class);
    }
    protected function photoUrl(): Attribute
    {
        return Attribute::make(
            get: fn($value) => $value ? Storage::url($value) : null,
        );
    }
}
