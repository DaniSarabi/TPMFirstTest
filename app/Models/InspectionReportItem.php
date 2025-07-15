<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


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
    ];

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
