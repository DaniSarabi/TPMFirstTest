<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\InspectionStatus;
use App\Models\InspectionReport;
use Illuminate\Support\Facades\Auth;



class InspectionController extends Controller
{
    //
    /**
     * Display a listing of the resource.
     * This will be our "Inspection History" page.
     */
    public function index(Request $request)
    {
        $searchQuery = $request->input('search');

        // --- ACTION 1: Remove the where() clause to fetch ALL reports ---
        $query = InspectionReport::with([
            'user:id,name',
            'machine:id,name,image_url',
            'items.status'
        ])
            ->latest('created_at');

        if (!$request->user()->can('inspections.administration')) {
            $query->where('user_id', $request->user()->id);
        }

        if ($searchQuery) {
            $query->whereHas('machine', function ($q) use ($searchQuery) {
                $q->where('name', 'like', '%' . $searchQuery . '%');
            });
        }

        $reports = $query->paginate(8)->through(function ($report) {
            $severityCounts = $report->items->countBy('status.severity');

            // --- ACTION 2: Add conditional logic for the badge text ---
            $badgeText = '';
            if ($report->status === 'completed') {
                $badgeText = $report->completed_at->diffForHumans($report->created_at, true);
            } elseif ($report->status === 'in_progress') {
                $badgeText = 'In Progress';
            } else {
                $badgeText = 'Abandoned';
            }

            return [
                'id' => $report->id,
                'status' => $report->status,
                'start_date' => $report->created_at->format('M d, Y, h:i A'),
                'completion_date' => $report->completed_at ? $report->completed_at->format('M d, Y, h:i A') : null,
                'badge_text' => $badgeText, // Send the new badge text
                'user_name' => $report->user->name,
                'machine_name' => $report->machine->name,
                'machine_image_url' => $report->machine->image_url,
                'stats' => [
                    'ok_count' => $severityCounts->get(0, 0),
                    'warning_count' => $severityCounts->get(1, 0),
                    'critical_count' => $severityCounts->get(2, 0),
                ]
            ];
        });

        return Inertia::render('Inspections/Index', [
            'reports' => $reports,
            'filters' => ['search' => $searchQuery],
        ]);
    }
    /**
     * Display the specified inspection report.
     *
     * @param  \App\Models\InspectionReport  $inspectionReport
     * @return \Inertia\Response
     */
    public function show(InspectionReport $inspectionReport)
    {
        // Eager-load all the necessary data in one go for efficiency
        $inspectionReport->load([
            'user:id,name',
            'machine:id,name',
            'items' => function ($query) {
                $query->with(['point:id,name,subsystem_id', 'status', 'point.subsystem:id,name']);
            }
        ]);

        // Group the report items by their subsystem
        $groupedItems = $inspectionReport->items->groupBy('point.subsystem.name');

        // Format the data to match the structure the frontend component expects
        $formattedSubsystems = $groupedItems->map(function ($items, $subsystemName) {
            return [
                'id' => $items->first()->point->subsystem->id,
                'name' => $subsystemName,
                'report_items' => $items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'comment' => $item->comment,
                        'image_url' => $item->image_url,
                        'status' => $item->status,
                        'point' => $item->point,
                    ];
                })->values(),
            ];
        })->values();

        // Prepare the final report object for the view
        $reportData = [
            'id' => $inspectionReport->id,
            'status' => $inspectionReport->status,
            'start_date' => $inspectionReport->created_at->format('M d, Y, h:i A'),
            'completion_date' => $inspectionReport->completed_at ? $inspectionReport->completed_at->format('M d, Y, h:i A') : null,
            'user_name' => $inspectionReport->user->name,
            'machine_name' => $inspectionReport->machine->name,
            'grouped_items' => $formattedSubsystems,
        ];

        return Inertia::render('Inspections/Show', [
            'report' => $reportData,
        ]);
    }
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
     * Store a new in-progress inspection report.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'machine_id' => 'required|exists:machines,id',
        ]);

        // Create a new report with the default status 'in_progress'
        $report = InspectionReport::create([
            'machine_id' => $validated['machine_id'],
            'user_id' => Auth::id(),
        ]);

        // Redirect to the "Perform Inspection" page for the new report
        return to_route('inspections.perform', $report->id);
    }

    /**
     * Show the main inspection page for a specific report.
     */
    public function perform(InspectionReport $inspectionReport)
    {
        // --- ACTION 1: Eager-load all necessary relationships for the page ---
        $inspectionReport->load([
            'machine.subsystems.inspectionPoints',
            'machine.creator',
            'machine.machineStatus',
            'machine.statusLogs.machineStatus'
        ]);

        // --- ACTION 2: Calculate uptime information for the associated machine ---
        $machine = $inspectionReport->machine;
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

        // Fetch all available inspection statuses
        $inspectionStatuses = InspectionStatus::all();

        // --- ACTION 3: Render the "Perform" page and pass all the necessary data ---
        return Inertia::render('Inspections/Perform', [
            'report' => $inspectionReport,
            'inspectionStatuses' => $inspectionStatuses,
            'uptime' => $uptimeData,
        ]);
    }
    /**
     * Update the specified resource in storage.
     * This method is called when the user submits the full inspection.
     */
    public function update(Request $request, InspectionReport $inspectionReport)
    {
        // Validate the incoming data
        $validated = $request->validate([
            'results' => 'required|array',
            'results.*.status_id' => 'required|exists:inspection_statuses,id',
            'results.*.comment' => 'nullable|string',
            'results.*.image' => 'nullable|file|image|max:2048',
        ]);

        // Loop through each inspection point result
        foreach ($validated['results'] as $pointId => $result) {
            $imagePath = null;
            // Check if an image was uploaded for this specific point
            if ($request->hasFile("results.{$pointId}.image")) {
                // Store the image in a dedicated folder and get its path
                $imagePath = $request->file("results.{$pointId}.image")->store('inspection_images', 'public');
            }

            // Create the inspection report item in the database
            $inspectionReport->items()->create([
                'inspection_point_id' => $pointId,
                'inspection_status_id' => $result['status_id'],
                'comment' => $result['comment'] ?? null,
                'image_url' => $imagePath,
            ]);
        }

        // Mark the main report as completed
        $inspectionReport->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        // We will add logic here later to create tickets and update machine status

        return to_route('dashboard')->with('success', 'Inspection submitted successfully!');
    }

    /**
     * Remove the specified resource from storage.
     * This is used to cancel/delete an in-progress inspection.
     */
    public function destroy(InspectionReport $inspectionReport)
    {
        // Add authorization check if needed, e.g., ensure the user owns this report.
        // $this->authorize('delete', $inspectionReport);

        // Delete the report. The database will cascade and delete all related items.
        $inspectionReport->delete();

        // Redirect back to the start page with a success message.
        return to_route('inspections.start')->with('success', 'Inspection has been cancelled.');
    }
}
