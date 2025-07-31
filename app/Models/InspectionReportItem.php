<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasOne;

class InspectionReportItem extends Model
{
    //
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'inspection_report_items';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'inspection_report_id',
        'inspection_point_id',
        'inspection_status_id',
        'comment',
        'image_url',
        'pinged_ticket_id',
    ];
    /**
     * --- ACTION: Add an accessor for the image_url attribute ---
     * This method will automatically format the image_url whenever it's accessed.
     */
    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: fn($value) => $value ? Storage::url($value) : null
        );
    }
    /**
     * An inspection item can have one ticket.
     */
    public function ticket(): HasOne
    {
        return $this->hasOne(Ticket::class);
    }
    /**
     * An inspection item can belong to one ticket if it was a "ping".
     */
    public function pingedTicket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'pinged_ticket_id');
    }

    /**
     * Get the main report that this item belongs to.
     */
    public function report(): BelongsTo
    {
        return $this->belongsTo(InspectionReport::class, 'inspection_report_id');
    }

    /**
     * Get the inspection point that this item refers to.
     */
    public function point(): BelongsTo
    {
        return $this->belongsTo(InspectionPoint::class, 'inspection_point_id');
    }

    /**
     * Get the status that was selected for this item.
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(InspectionStatus::class, 'inspection_status_id');
    }
}
