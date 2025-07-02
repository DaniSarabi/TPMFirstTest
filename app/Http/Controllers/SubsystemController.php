<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Machine;


class SubsystemController extends Controller
{
    //
    public function store(Request $request, Machine $machine)
    {
        // Validation remains the same.
        $validated = $request->validate([
            'subsystems' => 'present|array',
            'subsystems.*' => 'required|string|max:255',
        ]);

        // --- ACTION 1: Delete all existing subsystems for this machine ---
        // This prevents duplicates when the user goes back and forth.
        $machine->subsystems()->delete();

        // --- ACTION 2: Re-create the subsystems from the new list ---
        foreach ($validated['subsystems'] as $subsystemName) {
            $machine->subsystems()->create([
                'name' => $subsystemName,
            ]);
        }

        // --- ACTION 3: Eager-load the new subsystems to return them ---
        // We need to reload the relationship to get the fresh data.
        $machine->load('subsystems');

        // Return a success response with the newly created subsystems
        return response()->json([
            'message' => 'Subsystems synced successfully.',
            'subsystems' => $machine->subsystems,
        ]);
    }
}
