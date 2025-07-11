<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\MachineStatus;
use App\Models\Machine;
use App\Models\MachineStatusLog;



class MachineStatusController extends Controller
{
    //
    /**
     * Display a listing of the resource.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        // Fetch all machine statuses from the database
        $statuses = MachineStatus::latest()->get();

        // Render the new Inertia page and pass the statuses as a prop
        return Inertia::render('GeneralSettings/MachineStatus/Index', [
            'statuses' => $statuses,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:machine_statuses,name|max:255',
            'description' => 'nullable|string',
            'bg_color' => 'required|string',
            'text_color' => 'required|string',
        ]);

        MachineStatus::create($validated);

        return back()->with('success', 'Status created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MachineStatus $machineStatus)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:machine_statuses,name,' . $machineStatus->id,
            'description' => 'nullable|string',
            'bg_color' => 'required|string',
            'text_color' => 'required|string',
        ]);

        $machineStatus->update($validated);

        return back()->with('success', 'Status updated successfully.');
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, MachineStatus $machineStatus)
    {
        $validated = $request->validate([
            'new_status_id' => 'required|exists:machine_statuses,id',
        ]);

        // Prevent deleting the default status (ID 1)
        if ($machineStatus->id === 1) {
            return back()->with('error', 'The default status cannot be deleted.');
        }

        // --- ACTION 2: Re-assign all machines with the old status ---
        Machine::where('machine_status_id', $machineStatus->id)
            ->update(['machine_status_id' => $validated['new_status_id']]);

        // --- ACTION 3: Re-assign all log entries with the old status ---
        MachineStatusLog::where('machine_status_id', $machineStatus->id)
            ->update(['machine_status_id' => $validated['new_status_id']]);

        // --- ACTION 4: Now, safely delete the status ---
        $machineStatus->delete();

        return back()->with('success', 'Status deleted and machines reassigned successfully.');
    }
}
