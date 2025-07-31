<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\MachineStatus;
use App\Models\Machine;
use App\Models\MachineStatusLog;
use App\Models\InspectionStatus;
use Illuminate\Support\Facades\DB;

class MachineStatusController extends Controller
{
    //
    /**
     * Display a listing of the resource.
     *
     * @return \Inertia\Response
     */
       public function index(Request $request)
    {
        $filters = $request->only(['search', 'sort', 'direction']);

        $statuses = MachineStatus::query()
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where('name', 'like', '%' . $search . '%');
            })
            ->when($filters['sort'] ?? null, function ($query, $sort) use ($filters) {
                $direction = $filters['direction'] ?? 'asc';
                $query->orderBy($sort, $direction);
            }, function ($query) {
                // Default sort order if none is provided
                $query->latest();
            })
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('GeneralSettings/MachineStatus/Index', [
            'statuses' => $statuses,
            'filters' => $filters,
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

        // Prevent deleting a protected status
        if ($machineStatus->is_protected) {
            return back()->with('error', 'This status is protected and cannot be deleted.');
        }

        DB::transaction(function () use ($validated, $machineStatus) {
            $newStatusId = $validated['new_status_id'];

            // Re-assign all machines and logs.
            Machine::where('machine_status_id', $machineStatus->id)
                ->update(['machine_status_id' => $newStatusId]);

            MachineStatusLog::where('machine_status_id', $machineStatus->id)
                ->update(['machine_status_id' => $newStatusId]);
                
            // This finds all the pivot table entries that are using the old machine status ID
            // and updates them to point to the new one.
            DB::table('inspection_status_has_behaviors')
                ->where('machine_status_id', $machineStatus->id)
                ->update(['machine_status_id' => $newStatusId]);

            // Now, safely delete the status.
            $machineStatus->delete();
        });

        return back()->with('success', 'Status deleted and all related items reassigned successfully.');
    }
}
