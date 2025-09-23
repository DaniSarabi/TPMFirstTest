<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use App\Models\MachineStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use App\Events\MachineStatusChanged;
use App\Services\MachineHealthService;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\TicketStatus;
use Illuminate\Support\Facades\DB;
use App\Models\Tag;
use App\Models\Ticket;
use App\Models\TicketUpdate;
use App\Models\ScheduledMaintenance;
use App\Models\InspectionReport;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\MaintenancePlanExport;


class MachineController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'statuses', 'tags']);

        $finalStatusIds = TicketStatus::whereHas('behaviors', function ($query) {
            $query->whereIn('name', ['is_ticket_closing_status', 'is_ticket_discard_status']);
        })->pluck('id');

        $machines = Machine::with('creator', 'subsystems.inspectionPoints', 'tags')
            ->withCount([
                'tickets as open_tickets_count' => function ($query) use ($finalStatusIds) {
                    $query->whereNotIn('ticket_status_id', $finalStatusIds);
                },
                'scheduledMaintenances as pending_maintenances_count' => function ($query) {
                    $query->whereNotIn('status', ['completed', 'completed_overdue']);
                }
            ])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where('name', 'like', '%' . $search . '%');
            })
            ->when($filters['statuses'] ?? null, function ($query, $statuses) {
                $query->whereIn('status', $statuses);
            })
            ->when($filters['tags'] ?? null, function ($query, $tags) {
                $query->whereHas('tags', function ($q) use ($tags) {
                    $q->whereIn('tag_id', $tags);
                });
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        $machineIds = $machines->getCollection()->pluck('id');
        $latestInspections = InspectionReport::select('machine_id', DB::raw('MAX(completed_at) as last_date'))
            ->whereIn('machine_id', $machineIds)
            ->whereNotNull('completed_at')
            ->groupBy('machine_id')
            ->get()
            ->keyBy('machine_id');

        $machines->getCollection()->transform(function ($machine) use ($latestInspections) {
            // Cálculo del uptime
            $lastDowntime = $machine->downtimeLogs->whereNotNull('end_time')->sortByDesc('end_time')->first();
            $startTime = $lastDowntime ? Carbon::parse($lastDowntime->end_time) : $machine->created_at;
            $machine->current_uptime = $startTime->diffForHumans(null, true);

            // ACTION: Adjuntar la fecha de la última inspección a cada máquina.
            $lastInspectionDate = $latestInspections->get($machine->id)?->last_date;
            $machine->last_inspection_date = $lastInspectionDate ? Carbon::parse($lastInspectionDate)->format('M d, Y') : null;

            return $machine;
        });

        return Inertia::render('Machines/Index', [
            'machines' => $machines,
            'filters' => $filters,
            'tags' => Tag::orderBy('name')->get(),
            // Definimos los estados primarios directamente ya que son fijos
            'primaryStatuses' => ['new', 'in_service', 'out_of_service'],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('images', 'public');
        }

        // El 'status' por defecto ya se establece en 'new' en la migración.
        $machine = Machine::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'image_url' => $imagePath,
            'created_by' => Auth::id(),
        ]);

        return back()->with('flash', [
            'machine' => ['id' => $machine->id],
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Machine $machine, MachineHealthService $healthService)
    {
        $machine->load(['subsystems.inspectionPoints', 'creator', 'tags']);

        $maintenanceData = $this->_getMaintenanceHistoryData($request, $machine);
        $ticketData = $this->_getTicketHistoryData($request, $machine);

        $closingStatusIds = TicketStatus::whereHas('behaviors', fn ($q) => $q->where('name', 'is_ticket_closing_status'))->pluck('id');

        $lastInspection = $machine->inspectionReports()->whereNotNull('completed_at')->latest('completed_at')->first();
        $lastMaintenance = $machine->scheduledMaintenances()->where('status', 'completed')->latest('scheduled_date')->first();

        $stats = [
            'subsystems_count' => $machine->subsystems->count(),
            'inspection_points_count' => $machine->subsystems->reduce(fn ($c, $s) => $c + $s->inspectionPoints->count(), 0),
            'open_tickets_count' => $machine->tickets()->whereNotIn('ticket_status_id', $closingStatusIds)->count(),
            'last_inspection_date' => $lastInspection?->completed_at->format('M d, Y'),
            'last_maintenance_date' => $lastMaintenance?->scheduled_date->format('M d, Y'),
        ];

        $lastDowntime = $machine->downtimeLogs()->latest('end_time')->first();
        $uptime = [
            'duration' => $lastDowntime?->end_time ? Carbon::parse($lastDowntime->end_time)->diffForHumans(null, true) : 'N/A',
        ];

        $healthScores = [
            'today' => $healthService->getHealthStatsForPeriod($machine, Carbon::today()->startOfDay(), Carbon::today()->endOfDay()),
            'week' => $healthService->getHealthStatsForPeriod($machine, Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()),
            'month' => $healthService->getHealthStatsForPeriod($machine, Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()),
        ];

        return Inertia::render('Machines/Show', [
            'machine' => $machine,
            'uptime' => $uptime,
            'stats' => $stats,
            'healthScores' => $healthScores,
            ...$maintenanceData,
            ...$ticketData,
        ]);
    }

    /**
     * This private helper method encapsulates all the logic for fetching,
     * filtering, and paginating the maintenance history for a machine.
     */
    private function _getMaintenanceHistoryData(Request $request, Machine $machine): array
    {
        // ACTION: Updated validation to accept start and end ranges for year and month.
        $filters = $request->validate([
            'view_type' => 'nullable|string|in:upcoming,history',
            'maintenance_year_start' => 'nullable|integer|digits:4',
            'maintenance_year_end' => 'nullable|integer|digits:4',
            'maintenance_month_start' => 'nullable|integer|between:1,12',
            'maintenance_month_end' => 'nullable|integer|between:1,12',
            'maintenance_status' => 'nullable|string',
            'maintenance_per_page' => 'nullable|integer|in:12,24,36',
        ]);

        $subsystemIds = $machine->subsystems->pluck('id');

        // ACTION: This is the critical fix. The initial 'where' and 'orWhere'
        // logic is now wrapped in a single parent 'where' clause to ensure
        // that all subsequent filters apply to the entire set of maintenances.
        $baseQuery = ScheduledMaintenance::query()
            ->where(function ($query) use ($machine, $subsystemIds) {
                $query->where(function ($q) use ($machine) {
                    $q->where('schedulable_type', 'App\\Models\\Machine')
                        ->where('schedulable_id', $machine->id);
                })
                    ->orWhere(function ($q) use ($subsystemIds) {
                        $q->where('schedulable_type', 'App\\Models\\Subsystem')
                            ->whereIn('schedulable_id', $subsystemIds);
                    });
            });

        $activeYears = (clone $baseQuery)
            ->selectRaw('YEAR(scheduled_date) as year')
            ->distinct()
            ->pluck('year');

        $availableStatuses = ['completed', 'completed_overdue'];
        $perPage = $filters['maintenance_per_page'] ?? 12;

        $allMaintenancesQuery = (clone $baseQuery)
            ->with(['schedulable', 'template', 'report.user'])
            ->when($filters['maintenance_year_start'] ?? null, function ($query, $yearStart) use ($filters) {
                $yearEnd = $filters['maintenance_year_end'] ?? $yearStart;
                $query->whereBetween(DB::raw('YEAR(scheduled_date)'), [$yearStart, $yearEnd]);
            })
            ->when($filters['maintenance_month_start'] ?? null, function ($query, $monthStart) use ($filters) {
                $monthEnd = $filters['maintenance_month_end'] ?? $monthStart;
                $query->whereBetween(DB::raw('MONTH(scheduled_date)'), [$monthStart, $monthEnd]);
            })
            ->when($filters['maintenance_status'] ?? null, fn($q, $s) => $q->where('status', $s))
            ->when(($filters['view_type'] ?? 'history') === 'upcoming', function ($query) {
                $query->whereIn('status', ['scheduled', 'in_progress', 'in_progress_overdue'])->orderBy('scheduled_date', 'asc');
            }, function ($query) {
                $query->whereIn('status', ['completed', 'completed_overdue'])->latest('scheduled_date');
            });

        $allMaintenances = $allMaintenancesQuery->paginate($perPage, ['*'], 'maintenancePage')->withQueryString();

        return [
            'allMaintenances' => $allMaintenances,
            'maintenanceFilters' => $filters,
            'maintenanceFilterOptions' => [
                'activeYears' => $activeYears,
                'statuses' => $availableStatuses,
                'perPage' => [12, 24, 36],
            ],
        ];
    }

    /**
     * This new private helper method encapsulates all the logic for fetching,
     * filtering, and paginating the ticket history for a machine.
     */
    private function _getTicketHistoryData(Request $request, Machine $machine): array
    {
        $filters = $request->validate([
            'ticket_year_start' => 'nullable|integer|digits:4',
            'ticket_year_end' => 'nullable|integer|digits:4',
            'ticket_month_start' => 'nullable|integer|between:1,12',
            'ticket_month_end' => 'nullable|integer|between:1,12',
            'ticket_statuses' => 'nullable|array',
            'ticket_statuses.*' => 'integer|exists:ticket_statuses,id',
            'ticket_priorities' => 'nullable|array',
            'ticket_priorities.*' => 'integer|in:1,2',
            'ticket_categories' => 'nullable|array',
            'ticket_categories.*' => 'string',
            'ticket_per_page' => 'nullable|integer|in:12,24,36',
        ]);

        $perPage = $filters['ticket_per_page'] ?? 12;

        $ticketsQuery = Ticket::query()
            ->where('machine_id', $machine->id)
            ->with(['creator', 'status.behaviors', 'updates.user', 'updates.newStatus', 'inspectionItem'])
            ->when($filters['ticket_year_start'] ?? null, function ($query, $yearStart) use ($filters) {
                $yearEnd = $filters['ticket_year_end'] ?? $yearStart;
                $query->whereBetween(DB::raw('YEAR(created_at)'), [$yearStart, $yearEnd]);
            })
            ->when($filters['ticket_month_start'] ?? null, function ($query, $monthStart) use ($filters) {
                $monthEnd = $filters['ticket_month_end'] ?? $monthStart;
                $query->whereBetween(DB::raw('MONTH(created_at)'), [$monthStart, $monthEnd]);
            })
            ->when($filters['ticket_statuses'] ?? null, function ($query, $statuses) {
                $query->whereIn('ticket_status_id', $statuses);
            })
            ->when($filters['ticket_priorities'] ?? null, function ($query, $priorities) {
                $query->whereIn('priority', $priorities);
            })
            ->when($filters['ticket_categories'] ?? null, function ($query, $categories) {
                $query->whereHas('updates', fn($q) => $q->whereIn('category', $categories));
            })
            ->latest();

        $allTickets = $ticketsQuery->paginate($perPage, ['*'], 'ticketPage')->withQueryString();

        $finalStatusIds = TicketStatus::whereHas(
            'behaviors',
            fn($q) =>
            $q->whereIn('name', ['is_ticket_closing_status', 'is_ticket_discard_status'])
        )->pluck('id');

        $allTickets->getCollection()->transform(function (Ticket $ticket) use ($finalStatusIds) {
            // ACTION: This is the corrected logic.
            // We use the `first()` method with a closure to find the correct update.
            $closingUpdate = $ticket->updates->first(function ($update) use ($finalStatusIds) {
                return $finalStatusIds->contains($update->new_status_id);
            });

            if ($closingUpdate) {
                $ticket->solved_by = $closingUpdate->user;
                $ticket->resolution_category = $closingUpdate->category;
            }
            return $ticket;
        });

        $availableCategories = TicketUpdate::whereNotNull('category')
            ->distinct()
            ->pluck('category');

        $activeYears = Ticket::where('machine_id', $machine->id)
            ->selectRaw('YEAR(created_at) as year')
            ->distinct()
            ->pluck('year');

        return [
            'allTickets' => $allTickets,
            'ticketFilters' => $filters,
            'ticketFilterOptions' => [
                'statuses' => TicketStatus::all(['id', 'name', 'bg_color']),
                'priorities' => [['id' => 1, 'name' => 'Medium'], ['id' => 2, 'name' => 'High']],
                'categories' => $availableCategories,
                'activeYears' => $activeYears,
                'perPage' => [12, 24, 36],
            ],
        ];
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Machine $machine)
    {
        // La validación ahora es más simple, ya que el estado no se maneja aquí.
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($machine->image_url) {
                Storage::disk('public')->delete($machine->image_url);
            }
            $validated['image_url'] = $request->file('image')->store('images', 'public');
        }

        $machine->update($validated);

        return to_route('machines.show', $machine->id)
            ->with('success', 'Machine updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Machine $machine)
    {
        // Delete the machine. Because we set up 'onDelete('cascade')' in our migrations,
        // Laravel will automatically delete all of its associated subsystems and inspection points.
        $machine->delete();

        // Redirect the user back to the index page with a success message.
        return to_route('machines.index')->with('success', 'Machine deleted successfully.');
    }

    /**
     * Generate a QR code for starting an inspection for the specified machine.
     *
     * @return \Illuminate\Http\Response
     */
    public function generateQrCode(Machine $machine)
    {
        // --- Create the unique URL for the QR code ---
        // This URL points to the 'startFromQr' method we created earlier.
        $url = route('inspections.startFromQr', $machine->id);

        $logoPath = public_path('images/jstlogo.jpg');

        $qrCode = QrCode::format('svg')
            ->size(300)
            ->errorCorrection('H') // High error correction for durability
            ->generate($url);

        return response($qrCode)->header('Content-Type', 'image/svg+xml');
    }
    /**
     * Generate a printable Blade view for the QR code.
     */
    public function printQr(Machine $machine)
    {
        // This method simply renders a Blade view designed for printing.
        return view('pdf.qr-code', ['machine' => $machine]);
    }

    /**
     * Generate a downloadable PDF for the QR code.
     */
    public function downloadQrPdf(Machine $machine)
    {
        // This method uses dompdf to convert the same Blade view into a PDF.
        $pdf = Pdf::loadView('print.qr-code', ['machine' => $machine]);

        return $pdf->download('qr-code-' . $machine->name . '.pdf');
    }

    public function downloadMaintenancePlan(Request $request, Machine $machine)
    {
        $validated = $request->validate(['year' => 'required|integer|digits:4']);
        $year = $validated['year'];

        $fileName = "maintenance-plan-{$machine->name}-{$year}.xlsx";
        return Excel::download(new MaintenancePlanExport($machine, $year), $fileName);
    }
}
