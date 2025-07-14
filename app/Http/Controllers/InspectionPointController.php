<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Subsystem;
use App\Models\InspectionPoint;


class InspectionPointController extends Controller
{
    //Used by the Create Wizard
    public function store(Request $request)
    {
        
        // Validate that we receive an object where keys are subsystem IDs
        // and values are arrays of inspection point names.
        $validated = $request->validate([
            'inspection_points' => 'present|array',
            'inspection_points.*' => 'array', // Each value must be an array
            'inspection_points.*.*' => 'required|string|max:255', // Validate each point name
        ]);
        
        // Loop through the validated data
        foreach ($validated['inspection_points'] as $subsystemId => $pointNames) {
            // Find the subsystem to ensure it exists
            $subsystem = Subsystem::findOrFail($subsystemId);
            
            foreach ($pointNames as $pointName) {
                //dd($request->all());
                // Create the inspection point associated with the correct subsystem
                $subsystem->inspectionPoints()->create([
                    'name' => $pointName,
                ]);
            }
        }

        // Return a success response
        return response()->json(['message' => 'Inspection points created successfully.'], 201);
    }
     /**
     * Add a new inspection point to a subsystem.
     */
   public function add(Request $request)
    {
        // ---  Add validation for the subsystem_id ---
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subsystem_id' => 'required|exists:subsystems,id',
        ]);

        // Find the subsystem using the ID from the request data
        $subsystem = Subsystem::findOrFail($validated['subsystem_id']);

        $newPoint = $subsystem->inspectionPoints()->create([
            'name' => $validated['name'],
        ]);

        return back()->with('flash', ['newPoint' => $newPoint]);
    }

    /**
     * Update the specified inspection point in storage.
     */
    public function update(Request $request, InspectionPoint $inspectionPoint)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $inspectionPoint->update($validated);

        return back()->with('success', 'Inspection point updated successfully.');
    }

    /**
     * Remove the specified inspection point from storage.
     */
    public function destroy(InspectionPoint $inspectionPoint)
    {
        $inspectionPoint->delete();

        return back()->with('success', 'Inspection point deleted successfully.');
    }
}
