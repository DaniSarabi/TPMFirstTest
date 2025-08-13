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


class MachineController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $searchQuery = $request->input('search');
        $statusFilter = $request->input('statuses');

        $machines = Machine::with('creator', 'subsystems.inspectionPoints', 'machineStatus')
            ->when($searchQuery, function ($query, $search) {
                $query->where('name', 'like', '%' . $search . '%');
            })
            ->when($statusFilter && count($statusFilter) > 0, function ($query) use ($statusFilter) {
                $query->whereIn('machine_status_id', $statusFilter);
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Machines/Index', [
            'machines' => $machines,
            'filters' => [
                'search' => $searchQuery,
                'statuses' => $statusFilter,
            ],
            'machineStatuses' => MachineStatus::all(),

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

        // This ensures the model event has the correct data.
        $machine = Machine::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'image_url' => $imagePath,
            'created_by' => Auth::id(),
            'machine_status_id' => 1, // Set the default status to 'New' (ID 1)
        ]);

        // The 'created' event in the Machine model will now work correctly.

        return back()->with('flash', [
            'machine' => [
                'id' => $machine->id,
            ],
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Machine $machine)
    {
        // Eager-load all necessary relationships for the details page.
        $machine->load('creator', 'subsystems.inspectionPoints', 'statusLogs', 'machineStatus');

        // Calculate uptime information ---
        $uptimeData = [
            'since' => null,
            'duration' => null,
        ];

        // Find the most recent log entry where the status was set to "In Service".
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

        $stats = [
            'subsystems_count' => $machine->subsystems->count(),
            // --- ACTION: Update this line to be safer ---
            'inspection_points_count' => $machine->subsystems->reduce(function ($carry, $subsystem) {
                // Use the null-safe operator (?->) to prevent an error if the relationship is null.
                // The null coalescing operator (?? 0) ensures we add 0 if it's null.
                return $carry + ($subsystem->inspectionPoints?->count() ?? 0);
            }, 0),
        ];

        // Render the 'Show' page component and pass both the machine and uptime data.
        return Inertia::render('Machines/Show', [
            'machine' => $machine,
            'uptime' => $uptimeData,
            'stats' => $stats,
            'statuses' => MachineStatus::all(),

        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Machine $machine)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'machine_status_id' => 'required|exists:machine_statuses,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Check if the status has changed to create a log entry
        $statusChanged = $machine->machine_status_id !== (int) $validated['machine_status_id'];

        // Handle file upload...
        if ($request->hasFile('image')) {
            if ($machine->image_url) {
                Storage::disk('public')->delete($machine->image_url);
            }
            $validated['image_url'] = $request->file('image')->store('images', 'public');
        }

        $machine->update($validated);

        if ($statusChanged) {
            //  Use the correct ID to create the log ---
            $machine->statusLogs()->create([
                'machine_status_id' => $validated['machine_status_id'],
            ]);
            event(new MachineStatusChanged($machine));
        }

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
}
