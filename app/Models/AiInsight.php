<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiInsight extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'machine_id',
        'user_id',
        'type',
        'content',
        'status',
    ];

    // Relaciones para los dashboards
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }
    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }
    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    // Para mostrar solo lo que vale la pena (Pending y Validated)
    public function scopeVisible($query)
    {
        return $query->whereIn('status', ['pending', 'validated']);
    }

    // Para filtrar por tipo rápido: AiInsight::type('COACHING_OPPORTUNITY')->get();
    public function scopeType($query, $type)
    {
        return $query->where('type', $type);
    }
}
