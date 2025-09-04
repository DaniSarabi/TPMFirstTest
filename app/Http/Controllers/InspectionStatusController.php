<?php

namespace App\Http\Controllers;

use App\Models\Behavior;
use App\Models\InspectionReportItem;
use App\Models\InspectionStatus;
use App\Models\MachineStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use App\Models\Tag;

class InspectionStatusController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'sort', 'direction']);

        $statuses = InspectionStatus::with('behaviors')
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

        return Inertia::render('GeneralSettings/InspectionStatus/Index', [
            'statuses' => $statuses,
            'filters' => $filters,
            'tags' => Tag::all(),
            'behaviors' => Behavior::where('scope', 'inspection')->orWhere('scope', 'universal')->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:inspection_statuses,name|max:255',
            'bg_color' => 'required|string',
            'text_color' => 'required|string',
            'behaviors' => 'present|array',
            'behaviors.*.id' => 'required|exists:behaviors,id',
            'behaviors.*.tag_id' => 'nullable|exists:tags,id', // Changed from machine_status_id
        ]);

        DB::transaction(function () use ($validated) {
            // Determine severity based on behaviors
            $behaviorIds = collect($validated['behaviors'])->pluck('id');
            $behaviors = Behavior::find($behaviorIds);

            $severity = 0;
            if ($behaviors->contains('name', 'creates_ticket_sev2')) {
                $severity = 2;
            } elseif ($behaviors->contains('name', 'creates_ticket_sev1')) {
                $severity = 1;
            }

            // Create the new status
            $status = InspectionStatus::create([
                'name' => $validated['name'],
                'bg_color' => $validated['bg_color'],
                'text_color' => $validated['text_color'],
                'severity' => $severity,
            ]);

            // We will loop and attach each behavior rule individually.
            foreach ($validated['behaviors'] as $behaviorRule) {
                $status->behaviors()->attach(
                    $behaviorRule['id'],
                    ['tag_id' => $behaviorRule['tag_id'] ?? null]
                );
            }
        });

        return back()->with('success', 'Inspection status created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, InspectionStatus $inspectionStatus)
    {
        DB::transaction(function () use ($request, $inspectionStatus) {

            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255', Rule::unique('inspection_statuses')->ignore($inspectionStatus->id)],
                'bg_color' => 'required|string',
                'text_color' => 'required|string',
                'behaviors' => 'present|array',
                'behaviors.*.id' => 'required|exists:behaviors,id',
                'behaviors.*.tag_id' => 'nullable|exists:tags,id', // Changed from machine_status_id
            ]);

            $behaviorIds = collect($validated['behaviors'])->pluck('id');
            $behaviors = Behavior::find($behaviorIds);

            $severity = 0;
            if ($behaviors->contains('name', 'creates_ticket_sev2')) {
                $severity = 2;
            } elseif ($behaviors->contains('name', 'creates_ticket_sev1')) {
                $severity = 1;
            }

            $inspectionStatus->update([
                'name' => $validated['name'],
                'bg_color' => $validated['bg_color'],
                'text_color' => $validated['text_color'],
                'severity' => $severity,
            ]);

            // 1. First, remove all existing behavior rules.
            $inspectionStatus->behaviors()->detach();

            // 2. Then, loop and re-attach each new behavior rule.
            foreach ($validated['behaviors'] as $behaviorRule) {
                $inspectionStatus->behaviors()->attach(
                    $behaviorRule['id'],
                    ['tag_id' => $behaviorRule['tag_id'] ?? null]
                );
            }
        });

        return back()->with('success', 'Inspection status updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, InspectionStatus $inspectionStatus)
    {
        // ---  Update the destroy method logic ---
        $validated = $request->validate([
            'new_status_id' => 'required|exists:inspection_statuses,id',
        ]);

        // Prevent deleting the default status
        if ($inspectionStatus->is_default) {
            return back()->with('error', 'The default inspection status cannot be deleted.');
        }

        DB::transaction(function () use ($validated, $inspectionStatus) {
            // Re-assign any inspection report items that were using the old status
            InspectionReportItem::where('inspection_status_id', $inspectionStatus->id)
                ->update(['inspection_status_id' => $validated['new_status_id']]);

            // Now, safely delete the status
            $inspectionStatus->delete();
        });

        return back()->with('success', 'Status deleted and related items reassigned.');
    }
}
