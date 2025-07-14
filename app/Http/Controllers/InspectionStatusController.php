<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\InspectionStatus;
use Illuminate\Validation\Rule;


class InspectionStatusController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        return Inertia::render('GeneralSettings/InspectionStatus/Index', [
            'statuses' => InspectionStatus::latest()->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
        $validated = $request->validate([
            'name' => 'required|string|unique:inspection_statuses,name|max:255',
            'severity' => 'required|integer|min:0|max:2',
            'auto_creates_ticket' => 'required|boolean',
            'sets_machine_status_to' => 'nullable|string|max:255',
            'bg_color' => 'required|string',
            'text_color' => 'required|string',
            'is_default' => 'required|boolean',
        ]);

        // Ensure only one status can be the default
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
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('inspection_statuses')->ignore($inspectionStatus->id)],
            'severity' => 'required|integer|min:0|max:2',
            'auto_creates_ticket' => 'required|boolean',
            'sets_machine_status_to' => 'nullable|string|max:255',
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
     public function destroy(InspectionStatus $inspectionStatus)
    {
        // Prevent deleting the default status
        if ($inspectionStatus->is_default) {
            return back()->with('error', 'The default inspection status cannot be deleted.');
        }

        // We will add logic here later to re-assign any items using this status
        
        $inspectionStatus->delete();

        return back()->with('success', 'Inspection status deleted successfully.');
    }
}
