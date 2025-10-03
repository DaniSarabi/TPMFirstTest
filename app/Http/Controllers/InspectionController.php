<?php

namespace App\Http\Controllers;

use App\Events\InspectionCompleted;
use App\Events\TicketCreated;
use App\Models\InspectionReport;
use App\Models\InspectionStatus;
use App\Models\Machine;
use App\Models\MachineStatus;
use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Models\User;
use App\Services\TicketActionService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Services\TagManagerService;
use App\Services\DowntimeService;
use App\Models\Tag;
use Illuminate\Database\Eloquent\Builder;
use Spatie\Permission\Models\Role;

class InspectionController extends Controller
{


    public function __construct(protected TicketActionService $ticketActionService, protected TagManagerService $tagManager, protected DowntimeService $downtimeService) {}
    //
    /**
     * Display a listing of the resource.
     * This will be our "Inspection History" page.
     */
    public function index(Request $request)
    {
        // Se validan todos los filtros, incluyendo el nuevo de 'machines'
        $filters = $request->validate([
            'machines' => 'nullable|array',
            'machines.*' => 'integer|exists:machines,id',
            'user' => 'nullable|integer|exists:users,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'include_deleted' => 'nullable|boolean',
            'role' => 'nullable|string|exists:roles,name',
        ]);

        $query = InspectionReport::query()
            ->with([
                'machine' => fn($q) => $request->boolean('include_deleted') ? $q->withTrashed() : $q,
                'user:id,name',
                'items.status'
            ])
            ->where('status', 'completed');

        // Lógica para no mostrar reportes de máquinas borradas (a menos que se pida)
        if (!$request->boolean('include_deleted')) {
            $query->whereHas('machine');
        }

        // Se aplican los filtros a la consulta
        $query->when($filters['machines'] ?? null, fn(Builder $q, array $machineIds) => $q->whereIn('machine_id', $machineIds));
        $query->when($filters['user'] ?? null, fn(Builder $q, int $userId) => $q->where('user_id', $userId));
        $query->when($filters['start_date'] ?? null, fn(Builder $q, string $date) => $q->whereDate('completed_at', '>=', $date));
        $query->when($filters['end_date'] ?? null, fn(Builder $q, string $date) => $q->whereDate('completed_at', '<=', $date));
        $query->when($filters['role'] ?? null, function (Builder $query, string $roleName) {
            $query->whereHas('user.roles', fn(Builder $q) => $q->where('name', $roleName));
        });

        $reports = $query->latest('completed_at')->paginate(12)->withQueryString()->through(function ($report) {
            // ... (la transformación de datos se mantiene igual)
            $severityCounts = $report->items->countBy('status.severity');
            return [
                'id' => $report->id,
                'status' => $report->status,
                'start_date' => $report->created_at->format('M d, Y, h:i A'),
                'completion_date' => $report->completed_at?->format('M d, Y, h:i A'),
                'badge_text' => $report->completed_at?->diffForHumans($report->created_at, true),
                'user_name' => $report->user->name,
                'machine_name' => $report->machine?->name,
                'is_machine_deleted' => $report->machine?->trashed(),
                'machine_image_url' => $report->machine?->image_url,
                'stats' => [
                    'ok_count' => $severityCounts->get(0, 0),
                    'warning_count' => $severityCounts->get(1, 0),
                    'critical_count' => $severityCounts->get(2, 0),
                ],
            ];
        });

        $usersQuery = User::query();
        if ($request->user()->can('inspections.administration')) {
            $usersQuery->when($filters['role'] ?? null, function (Builder $query, string $roleName) {
                $query->whereHas('roles', fn(Builder $q) => $q->where('name', $roleName));
            });
        }
        $users = $request->user()->can('inspections.administration') ? $usersQuery->select('id', 'name')->orderBy('name')->get() : [];

        $machinesQuery = Machine::orderBy('name');
        if ($request->boolean('include_deleted')) {
            // Si el filtro está activo, incluimos las borradas.
            $machinesQuery->withTrashed();
        }

        return Inertia::render('Inspections/Index', [
            'reports' => $reports,
            'filters' => $filters,
            'users' => $users,
            'roles' => $request->user()->can('inspections.administration') ? Role::all(['id', 'name']) : [],
            // Se pasa la lista de todas las máquinas para el nuevo filtro
            'allMachines' => $machinesQuery->get(['id', 'name', 'deleted_at']),
        ]);
    }

    /**
     * Display the specified inspection report.
     *
     * @return \Inertia\Response
     */
    public function show(InspectionReport $inspectionReport)
    {
        // Eager-load all the necessary data in one go for efficiency
        $inspectionReport->load([
            'user:id,name',
            'machine' => fn($query) => $query->withTrashed(),
            'items' => function ($query) {
                $query->with([
                    'point:id,name,subsystem_id',
                    'status',
                    'point.subsystem:id,name',
                    'ticket:id,inspection_report_item_id', // Load the ticket ID
                ]);
            },
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

        // --- Determine if a status change was triggered by this report ---
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
                $statusChangeInfo = 'Set machine status to: ' . $newMachineStatus->name;
            }
        }

        // Prepare the final report object for the view
        $reportData = [
            'id' => $inspectionReport->id,
            'status' => $inspectionReport->status,
            'start_date' => $inspectionReport->created_at->format('M d, Y, h:i A'),
            'completion_date' => $inspectionReport->completed_at ? $inspectionReport->completed_at->format('M d, Y, h:i A') : null,
            'duration' => $inspectionReport->completed_at?->diffForHumans($inspectionReport->created_at, true),
            'user_name' => $inspectionReport->user->name,
            'machine_name' => $inspectionReport->machine?->name,
            'is_machine_deleted' => $inspectionReport->machine?->trashed(),
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
        $inspectionReport->load([
            'machine.subsystems.inspectionPoints',
            'machine.creator',
            'machine.tags', // <-- ACTION: Add this line
        ]);

        $machine = $inspectionReport->machine;

        // --- ACTION: Calculate the full stats object, just like in MachineController ---
        $closingStatusIds = TicketStatus::whereHas('behaviors', function ($query) {
            $query->where('name', 'is_ticket_closing_status');
        })->pluck('id');

        $lastInspection = $machine->inspectionReports()->whereNotNull('completed_at')->latest('completed_at')->first();
        $lastMaintenance = $machine->scheduledMaintenances()->where('status', 'completed')->latest('scheduled_date')->first();

        $stats = [
            'subsystems_count' => $machine->subsystems->count(),
            'inspection_points_count' => $machine->subsystems->reduce(fn($carry, $subsystem) => $carry + ($subsystem->inspectionPoints?->count() ?? 0), 0),
            'open_tickets_count' => $machine->tickets()->whereNotIn('ticket_status_id', $closingStatusIds)->count(),
            'last_inspection_date' => $lastInspection?->completed_at->format('M d, Y'),
            'last_maintenance_date' => $lastMaintenance?->scheduled_date->format('M d, Y'),
        ];

        $lastDowntime = $machine->downtimeLogs()->latest('end_time')->first();
        $uptimeData = [
            'since' => $lastDowntime?->end_time ? Carbon::parse($lastDowntime->end_time)->format('M d, Y') : null,
            'duration' => $lastDowntime?->end_time ? Carbon::parse($lastDowntime->end_time)->diffForHumans(null, true) : 'N/A',
        ];

        $inspectionStatuses = InspectionStatus::all();

        // --- Render the "Perform" page and pass all the necessary data ---
        return Inertia::render('Inspections/Perform', [
            'report' => $inspectionReport,
            'inspectionStatuses' => $inspectionStatuses,
            'uptime' => $uptimeData,
            'stats' => $stats, // <-- ACTION: Pass the new stats object
        ]);
    }

    /**
     * Update the specified resource in storage.
     * This method is called when the user submits the full inspection.
     */
    public function update(Request $request, InspectionReport $inspectionReport, TagManagerService $tagManager, DowntimeService $downtimeService)
    {
        // --- 1. Validation ---
        // The validation logic for the incoming inspection data remains the same.
        $results = $request->input('results', []);
        $rules = [
            'results' => 'required|array',
            'results.*.status_id' => 'required|exists:inspection_statuses,id',
            'results.*.pinged_ticket_id' => 'nullable|exists:tickets,id',
        ];

        foreach ($results as $pointId => $result) {
            if (empty($result['pinged_ticket_id'])) {
                $rules["results.{$pointId}.image"] = 'required|file|image|max:2048';
            }
            $status = InspectionStatus::find($result['status_id'] ?? null);
            if ($status && $status->severity > 0) {
                $rules["results.{$pointId}.comment"] = 'required|string';
            } else {
                $rules["results.{$pointId}.comment"] = 'nullable|string';
            }
        }
        $validated = Validator::make($request->all(), $rules)->validate();


        // --- 2. Database Transaction ---
        DB::transaction(function () use ($request, $inspectionReport, $validated, $tagManager, $downtimeService) {
            $openTicketStatus = TicketStatus::where('name', 'Open')->first();

            foreach ($validated['results'] as $pointId => $result) {
                // --- A. Create the Inspection Item ---
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
                $ticket = null; // Initialize ticket as null for this loop iteration.

                // --- B. Handle Pinging or Creating a New Ticket ---
                if ($status && $status->severity > 0) {
                    if (!empty($result['pinged_ticket_id'])) {
                        $ticketToPing = Ticket::find($result['pinged_ticket_id']);
                        if ($ticketToPing) {
                            $ticketToPing->updates()->create([
                                'user_id' => Auth::id(),
                                'comment' => 'Ping: This issue was reported again during inspection #' . $inspectionReport->id,
                            ]);
                        }
                    } else {
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
                            event(new TicketCreated($ticket));
                        }
                    }
                }

                // --- C. Delegate Tagging to the "Downtime Boss" ---
                // This is the new, simplified logic. We just tell the TagManager what happened.
                if ($status) {
                    foreach ($status->behaviors as $behavior) {
                        if ($behavior->name === 'applies_machine_tag') {
                            $tagId = $behavior->pivot->tag_id;
                            $tag = Tag::find($tagId);
                            if ($tag) {
                                // The TagManagerService will handle all the complex logic of updating
                                // the machine's status and starting/stopping downtime logs.
                                $tagManager->applyTag($inspectionReport->machine, $tag->slug, $ticket);
                            }
                        }
                    }
                }
            }

            // After all tickets have been created and tags applied, we make one final call
            // to the resolver. It will now have a complete and accurate view of the machine's state.
            $downtimeService->resolveDowntime($inspectionReport->machine);

            // --- 3. Finalize the Inspection Report ---
            $inspectionReport->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
            event(new InspectionCompleted($inspectionReport));
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
            'items.point.subsystem:id,name',
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
