<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TicketAttachment extends Model
{
    use HasFactory;

    /**
     * Los atributos que se pueden asignar en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'uuid',
        'ticket_id',
        'uploaded_by',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'description',
    ];

    /**
     * Los atributos que deben ser casteados.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'file_size' => 'integer',
    ];

    /**
     * Relaciones que deben "tocarse" (actualizar su updated_at) cuando este modelo se actualiza.
     *
     * @var array
     */
    protected $touches = [
        'ticket'
    ];

    /**
     * El "boot" method del modelo.
     * Genera automáticamente un UUID al crear un nuevo adjunto.
     */
    protected static function booted(): void
    {
        static::creating(function (TicketAttachment $attachment) {
            $attachment->uuid = (string) Str::uuid();
        });
    }

    /**
     * Obtiene la clave de ruta para el modelo.
     * Le dice a Laravel que use la columna 'uuid' para el route model binding.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    // --- RELACIONES ---

    /**
     * Obtiene el ticket al que pertenece este adjunto.
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * Obtiene el usuario que subió este adjunto.
     * Nota: especificamos la llave foránea 'uploaded_by'
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
