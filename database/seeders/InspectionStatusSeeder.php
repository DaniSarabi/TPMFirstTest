<?php

namespace Database\Seeders;

use App\Models\Behavior;
use App\Models\InspectionStatus;
use App\Models\MachineStatus;
use Illuminate\Database\Seeder;

class InspectionStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Fetch all the necessary behaviors and machine statuses first
        $behaviors = Behavior::whereIn('scope', ['inspection', 'universal'])->get()->keyBy('name');
        $machineStatuses = MachineStatus::all()->keyBy('name');

        // --- Status: OK ---
        $okStatus = InspectionStatus::firstOrCreate(['name' => 'OK'], [
            'severity' => 0,
            'bg_color' => '#dcfce7',
            'text_color' => '#166534',
        ]);

        // --- Status: Needs Attention ---
        $needsAttention = InspectionStatus::firstOrCreate(['name' => 'Needs Attention'], [
            'severity' => 1,
            'bg_color' => '#fef9c3',
            'text_color' => '#854d0e',
        ]);
        // Attach the behaviors using the pivot table
        $needsAttention->behaviors()->sync([
            $behaviors['creates_ticket_sev1']->id => [], // No extra data needed for this one
            $behaviors['sets_machine_status']->id => [
                'machine_status_id' => $machineStatuses['Needs Maintenance']->id,
            ],
        ]);

        // --- Status: Critical Failure ---
        $criticalFailure = InspectionStatus::firstOrCreate(['name' => 'Critical Failure'], [
            'severity' => 2,
            'bg_color' => '#fee2e2',
            'text_color' => '#991b1b',
        ]);
        $criticalFailure->behaviors()->sync([
            $behaviors['creates_ticket_sev2']->id => [],
            $behaviors['sets_machine_status']->id => [
                'machine_status_id' => $machineStatuses['Out of Service']->id,
            ],
        ]);

        $this->command->info('Inspection statuses and their behaviors seeded successfully.');
    }
}
