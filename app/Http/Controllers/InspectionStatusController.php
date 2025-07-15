<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\InspectionStatus;
use App\Models\InspectionReportItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Models\MachineStatus;


class InspectionStatusController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $statuses = InspectionStatus::with('machineStatus')->latest()->get();

        return Inertia::render('GeneralSettings/InspectionStatus/Index', [
            'statuses' => $statuses,
            'machineStatuses' => MachineStatus::all(),

        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // --- ACTION: Update the validation rules ---
        $validated = $request->validate([
            'name' => 'required|string|unique:inspection_statuses,name|max:255',
            'severity' => 'required|integer|min:0|max:2',
            'auto_creates_ticket' => 'required|boolean',
            'machine_status_id' => 'nullable|exists:machine_statuses,id',
            'bg_color' => 'required|string',
            'text_color' => 'required|string',
            'is_default' => 'required|boolean',
        ]);

        if ($validated['is_default']) {
            InspectionStatus::where('is_default', true)->update(['is_default' => false]);
        }

        InspectionStatus::create($validated);

        return back()->with('success', 'Inspection status created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, InspectionStatus $inspectionStatus)
    {
        // --- ACTION: Update the validation rules ---
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('inspection_statuses')->ignore($inspectionStatus->id)],
            'severity' => 'required|integer|min:0|max:2',
            'auto_creates_ticket' => 'required|boolean',
            'machine_status_id' => 'nullable|exists:machine_statuses,id',
            'bg_color' => 'required|string',
            'text_color' => 'required|string',
            'is_default' => 'required|boolean',
        ]);

        if ($validated['is_default']) {
            InspectionStatus::where('is_default', true)->update(['is_default' => false]);
        }

        $inspectionStatus->update($validated);

        return back()->with('success', 'Inspection status updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, InspectionStatus $inspectionStatus)
    {
        // --- ACTION 2: Update the destroy method logic ---
        $validated = $request->validate([
            'new_status_id' => 'required|exists:inspection_statuses,id',
        ]);

        // Prevent deleting the default status
        if ($inspectionStatus->is_default) {
            return back()->with('error', 'The default inspection status cannot be deleted.');
        }
        
        DB::transaction(function () use ($validated, $inspectionStatus) {
            // Re-assign any inspection report items that were using the old status
            InspectionReportItem::where('status_id', $inspectionStatus->id)
                ->update(['status_id' => $validated['new_status_id']]);

            // Now, safely delete the status
            $inspectionStatus->delete();
        });

        return back()->with('success', 'Status deleted and related items reassigned.');
    }
}
