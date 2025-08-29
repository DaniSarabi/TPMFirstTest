<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceReport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Barryvdh\DomPDF\Facade\Pdf;

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
    /**
     * Download the maintenance report as a PDF.
     */
    public function downloadPDF(MaintenanceReport $maintenanceReport)
    {
        // Cargar las mismas relaciones que en el método show
        $maintenanceReport->load([
            'user',
            'results.photos',
            'scheduledMaintenance.schedulable',
        ]);

        $pdf = Pdf::loadView('pdf.maintenance-report', ['report' => $maintenanceReport]);

        return $pdf->download('maintenance-report-' . $maintenanceReport->id . '.pdf');
    }
}
