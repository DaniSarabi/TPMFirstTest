<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Machine;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;


class MachineController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $searchQuery = $request->input('search');
        $statusFilter = $request->input('statuses');

        // --- ACTION: Update the 'with' clause to include nested relationships ---
        $machines = Machine::with('creator', 'subsystems.inspectionPoints')
            ->when($searchQuery, function ($query, $search) {
                $query->where('name', 'like', '%' . $search . '%');
            })
            ->when($statusFilter && count($statusFilter) > 0, function ($query) use ($statusFilter) {
                $query->whereIn('status', $statusFilter);
            })
            ->latest()
            ->paginate(8)
            ->withQueryString();

        return Inertia::render('Machines/Index', [
            'machines' => $machines,
            'filters' => [
                'search' => $searchQuery,
                'statuses' => $statusFilter,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
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

        $machine = Machine::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'image_url' => $imagePath,
            'created_by' => Auth::id(),
            'status' => 'New',
        ]);

        // This is the correct way to respond to an Inertia form submission.
        // We "flash" the new machine data so the frontend can get its ID.
        return back()->with('flash', [
            'machine' => [
                'id' => $machine->id,
            ]
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Machine $machine)
    {
        // Eager-load all necessary relationships for the details page.
        $machine->load('creator', 'subsystems.inspectionPoints', 'statusLogs');

        // Calculate uptime information ---
        $uptimeData = [
            'since' => null,
            'duration' => null,
        ];

        // Find the most recent log entry where the status was set to "In Service".
        $inServiceLog = $machine->statusLogs()
            ->where('status', 'In Service')
            ->latest()
            ->first();

        if ($inServiceLog) {
            $uptimeData['since'] = $inServiceLog->created_at->format('M d, Y, h:i A');
            // Use Carbon's diffForHumans() to get a readable duration like "2 days ago".
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
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Machine $machine)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|string|in:New,In Service,Under Maintenance,Out of Service',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Check if the status has changed to create a log entry
        $statusChanged = $machine->status !== $validated['status'];

        // Handle the file upload if a new image is provided
        if ($request->hasFile('image')) {
            // Delete the old image if it exists
            if ($machine->image_url) {
                Storage::disk('public')->delete($machine->image_url);
            }
            // Store the new image and add the path to the validated data
            $validated['image_url'] = $request->file('image')->store('images', 'public');
        }

        // Update the machine with the validated data
        $machine->update($validated);

        // Create a new log entry if the status changed
        if ($statusChanged) {
            $machine->statusLogs()->create([
                'status' => $validated['status'],
            ]);
        }

        // --- ACTION: Return a redirect with a success message ---
        // This is the correct response for an Inertia form submission.
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
}
