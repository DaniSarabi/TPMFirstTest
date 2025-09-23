<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use App\Services\MachineHealthService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request, MachineHealthService $healthService)
    {
        $machines = Machine::orderBy('name')->get(['id', 'name']);

        // --- DEBUGGING STEP ---
        // Descomenta la siguiente línea para ver qué está devolviendo la consulta.
       // dd($machines);

        if ($machines->isEmpty()) {
            return Inertia::render('dashboard', [
                'machines' => [],
                'healthStats' => null,
                'filters' => ['machine_id' => null, 'period' => 'today'],
            ]);
        }

        $validated = $request->validate([
            'machine_id' => 'nullable|exists:machines,id',
            'period' => 'nullable|in:today,week,month',
        ]);

        $selectedMachineId = $validated['machine_id'] ?? $machines->first()->id;
        $selectedPeriod = $validated['period'] ?? 'today';

        $machineToLoad = Machine::find($selectedMachineId);
        $healthStats = null;

        if ($machineToLoad) {
            $dates = match ($selectedPeriod) {
                'week' => [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()],
                'month' => [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()],
                default => [Carbon::today()->startOfDay(), Carbon::today()->endOfDay()],
            };
            $healthStats = $healthService->getHealthStatsForPeriod($machineToLoad, $dates[0], $dates[1]);
        }

        return Inertia::render('dashboard', [
            'machines' => $machines,
            'healthStats' => $healthStats,
            'filters' => [
                'machine_id' => $selectedMachineId,
                'period' => $selectedPeriod,
            ],
        ]);
    }
}

