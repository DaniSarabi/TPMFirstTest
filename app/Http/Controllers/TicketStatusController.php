<?php

namespace App\Http\Controllers;

use App\Models\Behavior;
use App\Models\MachineStatus;
use App\Models\Ticket;
use App\Models\TicketStatus;
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
                $query->where('name', 'like', '%'.$search.'%');
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
            'machineStatuses' => MachineStatus::all(),
            'behaviors' => Behavior::where('scope', 'ticket')->orWhere('scope', 'universal')->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:ticket_statuses,name|max:255',
            'bg_color' => 'required|string',
            'text_color' => 'required|string',
            'behaviors' => 'present|array',
            'behaviors.*.id' => 'required|exists:behaviors,id',
            'behaviors.*.machine_status_id' => 'nullable|exists:machine_statuses,id',
        ]);

        $behaviorsData = collect($validated['behaviors']);
        $setsMachineStatusBehavior = Behavior::where('name', 'sets_machine_status')->first();

        if ($setsMachineStatusBehavior && $behaviorsData->pluck('id')->contains($setsMachineStatusBehavior->id)) {
            $behaviorData = $behaviorsData->firstWhere('id', $setsMachineStatusBehavior->id);
            if (empty($behaviorData['machine_status_id'])) {
                throw ValidationException::withMessages([
                    'behaviors' => 'The "Machine Status to Set" is required when using the "sets_machine_status" behavior.',
                ]);
            }
        }

        DB::transaction(function () use ($validated) {
            $behaviorsToSyncData = collect($validated['behaviors']);
            $behaviorsToSync = $behaviorsToSyncData->keyBy('id')->map(function ($behavior) {
                return ['machine_status_id' => $behavior['machine_status_id']];
            });

            $closingBehavior = Behavior::where('name', 'is_ticket_closing_status')->first();

            if ($closingBehavior && $behaviorsToSyncData->pluck('id')->contains($closingBehavior->id)) {
                // First, remove this behavior from all other statuses.
                DB::table('ticket_status_has_behaviors')
                    ->where('behavior_id', $closingBehavior->id)
                    ->delete();
            }

            $status = TicketStatus::create($validated);
            $status->behaviors()->sync($behaviorsToSync);
        });

        return back()->with('success', 'Ticket status created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, TicketStatus $ticketStatus)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('ticket_statuses')->ignore($ticketStatus->id)],
            'bg_color' => 'required|string',
            'text_color' => 'required|string',
            'behaviors' => 'present|array',
            'behaviors.*.id' => 'required|exists:behaviors,id',
            'behaviors.*.machine_status_id' => 'nullable|exists:machine_statuses,id',
        ]);

        DB::transaction(function () use ($validated, $ticketStatus) {
            $behaviorsToSyncData = collect($validated['behaviors']);
            $behaviorsToSync = $behaviorsToSyncData->keyBy('id')->map(function ($behavior) {
                return ['machine_status_id' => $behavior['machine_status_id']];
            });

            $closingBehavior = Behavior::where('name', 'is_ticket_closing_status')->first();

            $behaviorsData = collect($validated['behaviors']);
            $setsMachineStatusBehavior = Behavior::where('name', 'sets_machine_status')->first();

            if ($setsMachineStatusBehavior && $behaviorsData->pluck('id')->contains($setsMachineStatusBehavior->id)) {
                $behaviorData = $behaviorsData->firstWhere('id', $setsMachineStatusBehavior->id);
                if (empty($behaviorData['machine_status_id'])) {
                    throw ValidationException::withMessages([
                        'behaviors' => 'The "Machine Status to Set" is required when using the "sets_machine_status" behavior.',
                    ]);
                }
            }
            if ($closingBehavior && $behaviorsToSyncData->pluck('id')->contains($closingBehavior->id)) {
                // Remove this behavior from any status that is NOT the one we are currently editing.
                DB::table('ticket_status_has_behaviors')
                    ->where('behavior_id', $closingBehavior->id)
                    ->where('ticket_status_id', '!=', $ticketStatus->id)
                    ->delete();
            }

            $ticketStatus->update($validated);
            $ticketStatus->behaviors()->sync($behaviorsToSync);
        });

        return back()->with('success', 'Ticket status updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, TicketStatus $ticketStatus)
    {
        // ---  Update the destroy method logic ---
        $validated = $request->validate([
            'new_status_id' => 'required|exists:ticket_statuses,id',
        ]);

        DB::transaction(function () use ($validated, $ticketStatus) {
            // Re-assign any inspection report items that were using the old status
            Ticket::where('ticket_status_id', $ticketStatus->id)
                ->update(['ticket_status_id' => $validated['new_status_id']]);

            // Now, safely delete the status
            $ticketStatus->delete();
        });

        return back()->with('success', 'Status deleted and related items reassigned.');
    }
}
