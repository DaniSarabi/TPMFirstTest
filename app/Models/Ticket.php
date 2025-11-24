<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Storage;

class Ticket extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'inspection_report_item_id',
        'machine_id',
        'title',
        'description',
        'image_url',
        'created_by',
        'ticket_status_id',
        'priority',
        'ai_analysis_json',
        'ai_processed_at',
    ];

    /**
     * Get the full URL for the ticket image.
     */
    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: function ($value, $attributes) {
                // 1. Busca la imagen del ticket standalone
                $path = $attributes['image_url'] ?? null;

                // 2. Devuelve la URL completa del storage solo si existe
                return $path ? Storage::url($path) : null;
            }
        );
    }
    /**
     * Obtiene todos los adjuntos para este ticket.
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(TicketAttachment::class)->latest();
    }
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        // This ensures created_at and updated_at are always Carbon objects
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        // Esto convierte automáticamente el JSON de la BD a un array de PHP
        'ai_analysis_json' => 'array',
        // Esto convierte el timestamp a una instancia de Carbon
        'ai_processed_at' => 'datetime',
    ];

    /**
     * Get the inspection item that generated this ticket.
     */
    public function inspectionItem(): BelongsTo
    {
        return $this->belongsTo(InspectionReportItem::class, 'inspection_report_item_id');
    }

    /**
     * Get the machine associated with this ticket.
     */
    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    /**
     * Get the user who created the ticket.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the current status of the ticket.
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(TicketStatus::class, 'ticket_status_id');
    }

    /**
     * Get the history of updates for the ticket.
     */
    public function updates(): HasMany
    {
        return $this->hasMany(TicketUpdate::class);
    }
    /**
     * Get all of the ticket's downtime logs.
     */
    public function downtimeLogs(): MorphMany
    {
        return $this->morphMany(DowntimeLog::class, 'downtimeable');
    }
    /**
     * Obtiene los insights generados por la IA para este ticket.
     */
    public function aiInsights(): HasMany
    {
        return $this->hasMany(AiInsight::class);
    }
}
