<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Machine;
use App\Models\Subsystem;


class SubsystemController extends Controller
{
    //used by the Create Wizard

    public function store(Request $request, Machine $machine)
    {
        // Validation remains the same.
        $validated = $request->validate([
            'subsystems' => 'present|array',
            'subsystems.*' => 'required|string|max:255',
        ]);

        //  Delete all existing subsystems for this machine ---
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
    /**
     * Add a new subsystem to an existing machine.
     * This will be used by the "Add Subsystem" modal on the details page.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Machine  $machine
     * @return \Illuminate\Http\JsonResponse
     */
    public function add(Request $request, Machine $machine)
    {

        // This method only adds, it does not delete existing records.
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $subsystem = $machine->subsystems()->create($validated);

        return response()->json($subsystem);
    }
    /**
     * Update a subsystem for when there's alredy one create.
     * This will be used by the "Add Subsystem" modal on the details page for when user goes back and forward.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Subsystem  $subsystem
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, Subsystem $subsystem)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $subsystem->update($validated);

        return response()->json($subsystem);
    }


    /**
     * Update a subsystem from the details page.
     * This is used by the "Edit Subsystem" modal.
     * It returns a redirect for the Inertia form.
     */
    public function updateFromPage(Request $request, Subsystem $subsystem)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $subsystem->update($validated);

        // Since the form was submitted with Inertia, we redirect back
        // with a success message for the toast notification.
        return back()->with('success', 'Subsystem updated successfully.');
    }
    

    
    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Subsystem  $subsystem
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Subsystem $subsystem)
    {
        // You can add authorization here if needed, e.g.,
        // $this->authorize('delete', $subsystem);

        // Delete the subsystem. Laravel will automatically delete its inspection points
        // because of the 'onDelete('cascade')' we set up in the migration.
        $subsystem->delete();

        // Redirect back to the previous page with a success message.
        return back()->with('success', 'Subsystem deleted successfully.');
    }
}
