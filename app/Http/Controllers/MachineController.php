<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Machine;
use Illuminate\Support\Facades\Auth;

class MachineController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
         // Fetch all machines from the database.
        // We use `with` to eager-load the subsystems and their inspection points.
        // This is very efficient and prevents many small database queries.
        $machines = Machine::with('subsystems.inspectionPoints')->latest()->get();

        // Render the React component and pass the machines data as a prop.
        return Inertia::render('Machines/Index', [
            'machines' => $machines,
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
        //
         // --- ACTION 1: Validate the incoming request data ---
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        // --- ACTION 2: Create the machine with the validated data ---
        // We also associate the machine with the currently logged-in user.
        $machine = Machine::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'created_by' => Auth::id(), // Get the ID of the authenticated user
        ]);

        // --- ACTION 3: Return a JSON response ---
        // Since we are inside a modal, we return the new machine data as JSON.
        // This allows the frontend to get the new machine's ID and move to the next step.
        return response()->json($machine);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
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
        // You can add authorization here if needed, e.g.,
        // $this->authorize('update', $machine);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $machine->update($validated);

        // Return the updated machine data as JSON.
        return response()->json($machine);
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
