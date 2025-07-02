<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Subsystem;

class InspectionPointController extends Controller
{
    //
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
}
