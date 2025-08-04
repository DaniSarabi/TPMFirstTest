<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\InspectionStatus;
use App\Models\InspectionReport;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\InspectionReportItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\MachineStatus;
use App\Models\TicketStatus;
use App\Models\Ticket;
use Illuminate\Support\Facades\Validator; // --- ACTION 1: Import the Validator facade ---

class InspectionController extends Controller
{
    //
    /**
     * Display a listing of the resource.
     * This will be our "Inspection History" page.
     */
    public function index(Request $request)
    {
        //  Get all filters from the request ---
        $filters = $request->only(['search', 'user', 'start_date', 'end_date']);

        $query = InspectionReport::with('user:id,name', 'machine:id,name,image_url', 'items.status')
            ->where('status', 'completed')
            ->latest('completed_at');

        if (!$request->user()->can('inspections.administration')) {
            $query->where('user_id', $request->user()->id);
        }

        // ---  Apply all filters to the query ---
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $query->whereHas('machine', function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%');
            });
        })->when($filters['user'] ?? null, function ($query, $userId) {
            $query->where('user_id', $userId);
        })->when($filters['start_date'] ?? null, function ($query, $startDate) {
            $query->whereDate('completed_at', '>=', $startDate);
        })->when($filters['end_date'] ?? null, function ($query, $endDate) {
            $query->whereDate('completed_at', '<=', $endDate);
        });

        $reports = $query->paginate(12)->through(function ($report) {
            $severityCounts = $report->items->countBy('status.severity');
            return [
                'id' => $report->id,
                'status' => $report->status,
                'start_date' => $report->created_at->format('M d, Y, h:i A'),
                'completion_date' => $report->completed_at ? $report->completed_at->format('M d, Y, h:i A') : null,
                'badge_text' => $report->completed_at ? $report->completed_at->diffForHumans($report->created_at, true) : 'In Progress',
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
            'filters' => $filters,
            // --- Pass the list of users for the filter dropdown ---
            // Only send users if the current user has permission to filter by them.
            'users' => $request->user()->can('inspections.administration') ? User::select('id', 'name')->get() : [],
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
                $query->with([
                    'point:id,name,subsystem_id',
                    'status',
                    'point.subsystem:id,name',
                    'ticket:id,inspection_report_item_id' // Load the ticket ID
                ]);
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
                        'ticket' => $item->ticket,
                        'pinged_ticket' => $item->pingedTicket,
                    ];
                })->values(),
            ];
        })->values();

        // ---Determine if a status change was triggered by this report ---
        $statusChangeInfo = null;
        $highestSeverity = -1;
        $statusThatTriggeredChange = null;

        foreach ($inspectionReport->items as $item) {
            if ($item->status && $item->status->severity > $highestSeverity) {
                $highestSeverity = $item->status->severity;
                $statusThatTriggeredChange = $item->status;
            }
        }

        if ($statusThatTriggeredChange && $statusThatTriggeredChange->machine_status_id) {
            // Find the name of the machine status that was set
            $newMachineStatus = MachineStatus::find($statusThatTriggeredChange->machine_status_id);
            if ($newMachineStatus) {
                $statusChangeInfo = "Set machine status to: " . $newMachineStatus->name;
            }
        }

        // Prepare the final report object for the view
        $reportData = [
            'id' => $inspectionReport->id,
            'status' => $inspectionReport->status,
            'start_date' => $inspectionReport->created_at->format('M d, Y, h:i A'),
            'completion_date' => $inspectionReport->completed_at ? $inspectionReport->completed_at->format('M d, Y, h:i A') : null,
            'user_name' => $inspectionReport->user->name,
            'machine_name' => $inspectionReport->machine->name,
            'grouped_items' => $formattedSubsystems,
            'status_change_info' => $statusChangeInfo,
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
     * 
     * QR FUNCCIONALITY MISSING
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
     * Create a new in-progress inspection report from a QR code scan.
     *
     * @param  \App\Models\Machine  $machine
     * @return \Illuminate\Http\RedirectResponse
     */
    public function startFromQr(Machine $machine)
    {
        // This method performs the same logic as the store() method,
        // but it's triggered by a simple GET request from the QR code.
        $report = InspectionReport::create([
            'machine_id' => $machine->id,
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
        // ---  Eager-load all necessary relationships for the page ---
        $inspectionReport->load([
            'machine.subsystems.inspectionPoints',
            'machine.creator',
            'machine.machineStatus',
            'machine.statusLogs.machineStatus'
        ]);

        // ---  Calculate uptime information for the associated machine ---
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

        // ---  Render the "Perform" page and pass all the necessary data ---
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

        $results = $request->input('results', []);
        $rules = [
            'results' => 'required|array',
            'results.*.status_id' => 'required|exists:inspection_statuses,id',
            'results.*.pinged_ticket_id' => 'nullable|exists:tickets,id',
        ];

        // Build conditional rules for comments and mandatory photos
        foreach ($results as $pointId => $result) {
            // Every point now requires an image, unless it's a ping
            if (empty($result['pinged_ticket_id'])) {
                $rules["results.{$pointId}.image"] = 'required|file|image|max:2048';
            }

            // Find the selected status to check its severity
            $status = InspectionStatus::find($result['status_id'] ?? null);
            if ($status && $status->severity > 0) {
                // The comment is required if the severity is 1 or 2
                $rules["results.{$pointId}.comment"] = 'required|string';
            } else {
                $rules["results.{$pointId}.comment"] = 'nullable|string';
            }
        }

        $validated = Validator::make($request->all(), $rules)->validate();

        DB::transaction(function () use ($request, $inspectionReport, $validated) {
            
            

            $highestSeverityStatus = null;
            $openTicketStatus = TicketStatus::where('name', 'Open')->first();
            $newlyCreatedTickets = [];

            // Loop through each inspection point result to save it
            foreach ($validated['results'] as $pointId => $result) {
                $imagePath = null;
                if ($request->hasFile("results.{$pointId}.image")) {
                    $imagePath = $request->file("results.{$pointId}.image")->store('inspection_images', 'public');
                }

                $item = $inspectionReport->items()->create([
                    'inspection_point_id' => $pointId,
                    'inspection_status_id' => $result['status_id'],
                    'comment' => $result['comment'] ?? null,
                    'image_url' => $imagePath,
                    'pinged_ticket_id' => $result['pinged_ticket_id'] ?? null,
                ]);

                $status = InspectionStatus::with('behaviors')->find($result['status_id']);
                if ($status && ($highestSeverityStatus === null || $status->severity > $highestSeverityStatus->severity)) {
                    $highestSeverityStatus = $status;
                }

                if ($status && $status->severity > 0) {
                    if (!empty($result['pinged_ticket_id'])) {
                        // This is a PING
                        $ticketToPing = Ticket::find($result['pinged_ticket_id']);
                        if ($ticketToPing) {
                            $ticketToPing->updates()->create([
                                'user_id' => Auth::id(),
                                'comment' => 'Ping: This issue was reported again during inspection #' . $inspectionReport->id,
                            ]);
                        }
                    } else {
                        // This is a NEW TICKET
                        if ($openTicketStatus && ($status->behaviors->contains('name', 'creates_ticket_sev1') || $status->behaviors->contains('name', 'creates_ticket_sev2'))) {
                            $ticket = Ticket::create([
                                'inspection_report_item_id' => $item->id,
                                'machine_id' => $inspectionReport->machine_id,
                                'title' => $item->point->name,
                                'description' => $item->comment,
                                'created_by' => Auth::id(),
                                'ticket_status_id' => $openTicketStatus->id,
                                'priority' => $status->severity,
                            ]);
                            $ticket->updates()->create([
                                'user_id' => Auth::id(),
                                'comment' => 'Ticket created from inspection report #' . $inspectionReport->id,
                                'new_status_id' => $openTicketStatus->id,
                            ]);
                            $newlyCreatedTickets[] = $ticket;
                        }
                    }
                }
            }

            // Check the behavior of the highest severity status to update the machine
            if ($highestSeverityStatus) {
                $setStatusBehavior = $highestSeverityStatus->behaviors()->where('name', 'sets_machine_status')->first();

                if ($setStatusBehavior) {
                    $newMachineStatusId = $setStatusBehavior->pivot->machine_status_id;
                    if ($newMachineStatusId) {
                        $inspectionReport->machine()->update(['machine_status_id' => $newMachineStatusId]);

                        // --- Log the machine status change on all created tickets ---
                        $newMachineStatus = MachineStatus::find($newMachineStatusId);
                        foreach ($newlyCreatedTickets as $ticket) {
                            $ticket->updates()->create([
                                'user_id' => Auth::id(), // The user who triggered the event
                                'comment' => 'System: Machine status updated via inspection.',
                                'new_machine_status_id' => $newMachineStatus->id,
                            ]);
                        }
                    }
                }
            }

            // Mark the main report as completed
            $inspectionReport->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
        });

        return to_route('inspections.start')->with('success', 'Inspection submitted successfully!');
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
    /**
     * Generate and download a PDF for the specified inspection report.
     */
    public function downloadPDF(InspectionReport $inspectionReport)
    {
        $inspectionReport->load([
            'user:id,name',
            'machine:id,name',
            'items.point:id,name,subsystem_id',
            'items.status',
            'items.point.subsystem:id,name'
        ]);

        $groupedItems = $inspectionReport->items->groupBy('point.subsystem.name');

        // --- ACTION: Add the full image path to each item for the PDF ---
        $inspectionReport->items->each(function ($item) {
            if ($item->image_url) {
                // The public_path() helper gets the absolute server path to the image
                $item->full_image_path = public_path($item->image_url);
            }
        });

        $pdf = Pdf::loadView('pdf.inspection-report', [
            'report' => $inspectionReport,
            'groupedItems' => $groupedItems,
        ]);

        return $pdf->download('inspection-report-' . $inspectionReport->id . '.pdf');
    }
}
