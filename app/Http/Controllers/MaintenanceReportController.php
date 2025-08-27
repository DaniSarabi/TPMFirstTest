<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceReport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceReportController extends Controller
{
    /**
     * Display the specified resource.
     */
    public function show(MaintenanceReport $maintenanceReport): Response
    {
        // Eager load all the necessary relationships for the report view
        $maintenanceReport->load([
            'user', // The user who completed the report
            'results.photos', // The results and their photos
            'scheduledMaintenance' => function ($query) {
                $query->with('schedulable', 'template.tasks');
            },
        ]);

        return Inertia::render('MaintenanceReport/Show', [
            'report' => $maintenanceReport,
        ]);
    }
}
