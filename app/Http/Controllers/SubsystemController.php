<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use App\Models\Subsystem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;


class SubsystemController extends Controller
{
    // used by the Create Wizard

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

    public function destroy(Subsystem $subsystem): RedirectResponse
    {
        // $this->authorize('delete', $subsystem);

        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
        // Lo envolvemos en una transacción para que, si algo falla, no se haga nada.
        DB::transaction(function () use ($subsystem) {

            // 2. Primero, borramos "suavemente" todos los hijos (puntos de inspección)
            // Como InspectionPoint usa SoftDeletes, esto también será un soft delete.
            $subsystem->inspectionPoints()->delete();

            // 3. Ahora sí, borramos "suavemente" al padre (el subsistema)
            $subsystem->delete();
        });

        // El comentario viejo era incorrecto. La cascada de la BD no se activa.
        // Lo hacemos manualmente como arriba.

        return back()->with('success', 'Subsystem and all its inspection points deleted successfully.');
    }
}
