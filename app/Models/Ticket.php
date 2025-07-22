<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory;

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
        'created_by',
        'ticket_status_id',
        'priority',
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
}
