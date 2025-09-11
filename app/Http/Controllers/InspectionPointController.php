<?php

namespace App\Http\Controllers;

use App\Models\InspectionPoint;
use App\Models\Subsystem;
use App\Models\Ticket;
use App\Models\TicketStatus;
use Illuminate\Http\Request;

class InspectionPointController extends Controller
{
    // Used by the Create Wizard
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
                // dd($request->all());
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

    /**
     * Get all open tickets for a specific inspection point.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getOpenTickets(InspectionPoint $inspectionPoint)
    {
        // Get all statuses that should be excluded (closing or discarded)
        $excludedStatuses = TicketStatus::whereHas('behaviors', function ($query) {
            $query->whereIn('name', [
                'is_ticket_closing_status',
                'is_ticket_discard_status',
            ]);
        })->pluck('id');

        // Fetch tickets that belong to the inspection point and are not excluded
        $openTickets = Ticket::with([
            'creator:id,name',
            'inspectionItem:id,image_url',
        ])
            ->whereHas('inspectionItem', function ($query) use ($inspectionPoint) {
                $query->where('inspection_point_id', $inspectionPoint->id);
            })
            ->whereNotIn('ticket_status_id', $excludedStatuses)
            ->latest()
            ->get();

        return response()->json($openTickets);
    }
}
