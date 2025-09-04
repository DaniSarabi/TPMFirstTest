<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Behavior;
use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Models\Tag; // Importar el modelo Tag
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class TicketStatusController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'sort', 'direction']);

        $statuses = TicketStatus::with('behaviors')
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where('name', 'like', '%' . $search . '%');
            })
            ->when($filters['sort'] ?? null, function ($query, $sort) use ($filters) {
                $direction = $filters['direction'] ?? 'asc';
                $query->orderBy($sort, $direction);
            }, function ($query) {
                $query->latest();
            })
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('GeneralSettings/TicketStatus/Index', [
            'statuses' => $statuses,
            'filters' => $filters,
            'tags' => Tag::orderBy('name')->get(), // Ahora enviamos los Tags
            'behaviors' => Behavior::where('scope', 'like', '%ticket%')->orWhere('scope', 'universal')->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Actualizar la validación para que use tag_id
        $validated = $request->validate([
            'name' => 'required|string|unique:ticket_statuses,name|max:255',
            'bg_color' => 'required|string',
            'text_color' => 'required|string',
            'is_protected' => 'boolean',
            'behaviors' => 'present|array',
            'behaviors.*.id' => 'required|exists:behaviors,id',
            'behaviors.*.tag_id' => 'nullable|exists:tags,id',
        ]);

        DB::transaction(function () use ($validated) {
            $statusData = collect($validated)->except('behaviors')->all();
            $status = TicketStatus::create($statusData);

            // ACTION: Replaced the old sync() logic with a loop that correctly attaches each rule.
            // This is what fixes the "only saves one tag" bug.
            foreach ($validated['behaviors'] as $behaviorRule) {
                $status->behaviors()->attach(
                    $behaviorRule['id'],
                    ['tag_id' => $behaviorRule['tag_id'] ?? null]
                );
            }
        });

        return back()->with('success', 'Ticket status created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, TicketStatus $ticketStatus)
    {
        // ACTION: Simplified the validation.
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('ticket_statuses')->ignore($ticketStatus->id)],
            'bg_color' => 'required|string',
            'text_color' => 'required|string',
            'is_protected' => 'boolean',
            'behaviors' => 'present|array',
            'behaviors.*.id' => 'required|exists:behaviors,id',
            'behaviors.*.tag_id' => 'nullable|exists:tags,id',
        ]);

        DB::transaction(function () use ($validated, $ticketStatus) {
            $statusData = collect($validated)->except('behaviors')->all();
            $ticketStatus->update($statusData);

            // ACTION: Replaced the old sync() logic with the correct detach() and attach() loop.
            // 1. First, remove all existing behavior rules for this status.
            $ticketStatus->behaviors()->detach();

            // 2. Then, loop through the new rules and attach them one by one.
            foreach ($validated['behaviors'] as $behaviorRule) {
                $ticketStatus->behaviors()->attach(
                    $behaviorRule['id'],
                    ['tag_id' => $behaviorRule['tag_id'] ?? null]
                );
            }
        });

        return back()->with('success', 'Ticket status updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, TicketStatus $ticketStatus)
    {
        $validated = $request->validate([
            'new_status_id' => 'required|exists:ticket_statuses,id',
        ]);

        // --- ACTION: Refactored logic to check for the 'is_protected' behavior ---
        // Eager-load the behaviors relationship to check for protection.
        $ticketStatus->load('behaviors');

        if ($ticketStatus->behaviors->contains('name', 'is_protected')) {
            return back()->with('error', 'This status is protected by a system behavior and cannot be deleted.');
        }

        DB::transaction(function () use ($validated, $ticketStatus) {
            Ticket::where('ticket_status_id', $ticketStatus->id)
                ->update(['ticket_status_id' => $validated['new_status_id']]);

            $ticketStatus->delete();
        });

        return back()->with('success', 'Status deleted and related items reassigned.');
    }
}
