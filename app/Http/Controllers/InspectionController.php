<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\InspectionStatus;


class InspectionController extends Controller
{
    //
    /**
     * Show the form for creating a new resource.
     * This will be our "Start Inspection" page.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        // We fetch all machines to populate the manual selection dropdown.
        // We only select the id and name for efficiency.
        $machines = Machine::select('id', 'name')->get();

        // Render the new "Start" page component and pass the machines list as a prop.
        return Inertia::render('Inspections/Start', [
            'machines' => $machines,
        ]);
    }
    /**
     * Show the main inspection page for a specific machine.
     *
     * @param \App\Models\Machine $machine
     * @return \Inertia\Response
     */
    public function perform(Machine $machine)
    {
        // Eager-load the full checklist for the machine
        $machine->load('subsystems.inspectionPoints');


        $uptimeData = [
            'since' => null,
            'duration' => null,
        ];

        $inServiceLog = $machine->statusLogs()
            ->whereHas('machineStatus', function ($query) {
                $query->where('name', 'In Service');
            })
            ->latest()
            ->first();

        if ($inServiceLog) {
            $uptimeData['since'] = $inServiceLog->created_at->format('M d, Y, h:i A');
            $uptimeData['duration'] = $inServiceLog->created_at->diffForHumans(null, true, true);
        }


        // Fetch all available inspection statuses for the operator to choose from
        $inspectionStatuses = InspectionStatus::all();

        // Render the "Perform" page and pass the necessary data
        return Inertia::render('Inspections/Perform', [
            'machine' => $machine,
            'inspectionStatuses' => $inspectionStatuses,
            'uptime' => $uptimeData,

        ]);
    }
}
