<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\EscalationLevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use App\Models\EscalationPolicy;

class EscalationLevelController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'escalation_policy_id' => 'required|exists:escalation_policies,id',
            'days_after' => 'required|integer|min:0',
        ]);

        $policy = EscalationPolicy::find($validated['escalation_policy_id']);

        // FIX: Asignar el siguiente número de nivel secuencial
        $nextLevel = ($policy->levels()->max('level') ?? 0) + 1;

        EscalationLevel::create([
            'escalation_policy_id' => $validated['escalation_policy_id'],
            'level' => $nextLevel,
            'days_after' => $validated['days_after'],
        ]);

        return Redirect::back()->with('success', 'Escalation level added.');
    }

    public function update(Request $request, EscalationLevel $escalationLevel)
    {
        $validated = $request->validate([
            'days_after' => 'required|integer|min:0',
        ]);

        $escalationLevel->update($validated);

        return Redirect::back()->with('success', 'Escalation level updated.');
    }

    public function destroy(EscalationLevel $escalationLevel)
    {
        $policy = $escalationLevel->policy;
        $escalationLevel->delete();

        // FIX: Después de eliminar, reordenar los niveles restantes
        $this->reorderLevels($policy);

        return Redirect::back()->with('success', 'Escalation level deleted.');
    }

    /**
     * Sync the email contacts for a specific escalation level.
     */
    public function syncContacts(Request $request, EscalationLevel $escalationLevel)
    {
        $validated = $request->validate([
            'contact_ids' => 'present|array',
            'contact_ids.*' => 'integer|exists:email_contacts,id',
        ]);

        $escalationLevel->emailContacts()->sync($validated['contact_ids']);

        return Redirect::back()->with('success', 'Contacts updated for this level.');
    }

    /**
     * Helper method to re-order the levels of a policy sequentially.
     */
    private function reorderLevels(EscalationPolicy $policy)
    {
        $levels = $policy->levels()->orderBy('level')->get();
        foreach ($levels as $index => $level) {
            $level->level = $index + 1;
            $level->save();
        }
    }
}
