<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\EscalationPolicy;
use App\Models\EmailContact; // Importa el modelo de contactos
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Redirect;


class EscalationPolicyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        // Carga las políticas con sus niveles y los contactos asociados a cada nivel
        $policies = EscalationPolicy::with('levels.emailContacts')->get();
        $contacts = EmailContact::orderBy('name')->get();

        return Inertia::render('GeneralSettings/EscalationPolicies/Index', [
            'policies' => $policies,
            'contacts' => $contacts, // Pasa todos los contactos disponibles para el selector
        ]);
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:escalation_policies,name',
            'description' => 'nullable|string|max:1000',
        ]);
        EscalationPolicy::create($validated);
        return Redirect::route('settings.escalation-policies.index')->with('success', 'Policy created.');
    }

    public function update(Request $request, EscalationPolicy $escalationPolicy)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:escalation_policies,name,' . $escalationPolicy->id,
            'description' => 'nullable|string|max:1000',
        ]);
        $escalationPolicy->update($validated);
        return Redirect::back()->with('success', 'Policy updated.');
    }

    public function destroy(EscalationPolicy $escalationPolicy)
    {
        $escalationPolicy->delete();
        return Redirect::route('settings.escalation-policies.index')->with('success', 'Policy deleted.');
    }
    /**
     * Toggle the active status of an escalation policy.
     */
    public function toggleStatus(EscalationPolicy $escalationPolicy)
    {
        $escalationPolicy->update([
            'is_active' => !$escalationPolicy->is_active,
        ]);

        return Redirect::back()->with('success', 'Policy status updated.');
    }
}
