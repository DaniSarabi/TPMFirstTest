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
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\TicketStatus;
use Carbon\Carbon;
use App\Models\Tag;

class MachineController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'statuses', 'tags']);

        $machines = Machine::with('creator', 'subsystems.inspectionPoints', 'tags')
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
    public function show(Machine $machine)
    {
        // Cargar las relaciones necesarias de forma eficiente
        $machine->load([
            'subsystems.inspectionPoints',
            'creator',
            'tags',
            'scheduledMaintenances.template',
            'scheduledMaintenances.report',
            'scheduledMaintenances.schedulable',
            'subsystems.scheduledMaintenances.template',
            'subsystems.scheduledMaintenances.report',
            'subsystems.scheduledMaintenances.schedulable',
        ]);

        // Combinar todos los mantenimientos en una sola lista ordenada
        $machineMaintenances = $machine->scheduledMaintenances;
        $subsystemMaintenances = $machine->subsystems->flatMap->scheduledMaintenances;
        $allMaintenances = $machineMaintenances->merge($subsystemMaintenances)->sortByDesc('scheduled_date');
        $machine->all_maintenances = $allMaintenances->values()->all();


        
        // Obtener IDs de los estados de ticket de cierre
        $closingStatusIds = TicketStatus::whereHas('behaviors', function ($query) {
            $query->where('name', 'is_ticket_closing_status');
        })->pluck('id');

        // Obtener las últimas fechas de inspección y mantenimiento
        $lastInspection = $machine->inspectionReports()->whereNotNull('completed_at')->latest('completed_at')->first();
        $lastMaintenance = $machine->scheduledMaintenances()->where('status', 'completed')->latest('scheduled_date')->first();

        $stats = [
            'subsystems_count' => $machine->subsystems->count(),
            'inspection_points_count' => $machine->subsystems->reduce(fn($carry, $subsystem) => $carry + ($subsystem->inspectionPoints?->count() ?? 0), 0),
            'open_tickets_count' => $machine->tickets()->whereNotIn('ticket_status_id', $closingStatusIds)->count(),
            'last_inspection_date' => $lastInspection?->completed_at->format('M d, Y'),
            'last_maintenance_date' => $lastMaintenance?->scheduled_date->format('M d, Y'),
        ];

        // Calcular el Uptime usando la tabla downtime_logs
        $lastDowntime = $machine->downtimeLogs()->latest('end_time')->first();
        $uptime = [
            'since' => $lastDowntime?->end_time ? Carbon::parse($lastDowntime->end_time)->format('M d, Y') : null,
            'duration' => $lastDowntime?->end_time ? Carbon::parse($lastDowntime->end_time)->diffForHumans(null, true) : 'N/A',
        ];

        return Inertia::render('Machines/Show', [
            'machine' => $machine,
            'uptime' => $uptime,
            'stats' => $stats,
        ]);
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

    public function downloadMaintenanceSchedulePDF(Machine $machine)
    {
        // Reutilizar la misma lógica de carga de datos que el método show
        $machine->load([
            'scheduledMaintenances.schedulable',
            'scheduledMaintenances.report',
            'subsystems.scheduledMaintenances.schedulable',
            'subsystems.scheduledMaintenances.report',
        ]);

        $machineMaintenances = $machine->scheduledMaintenances;
        $subsystemMaintenances = $machine->subsystems->flatMap->scheduledMaintenances;
        $allMaintenances = $machineMaintenances->merge($subsystemMaintenances)->sortBy('scheduled_date');

        $upcoming = $allMaintenances->whereNotIn('status', ['completed', 'completed_overdue']);
        $history = $allMaintenances->whereIn('status', ['completed', 'completed_overdue']);

        $pdf = Pdf::loadView('pdf.maintenance-schedule', [
            'machine' => $machine,
            'upcoming' => $upcoming,
            'history' => $history,
        ]);

        return $pdf->download('maintenance-schedule-' . $machine->name . '.pdf');
    }
}
