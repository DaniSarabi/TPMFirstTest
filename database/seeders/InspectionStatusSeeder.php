<?php

namespace Database\Seeders;

use App\Models\Behavior;
use App\Models\InspectionStatus;
use App\Models\MachineStatus;
use Illuminate\Database\Seeder;
use App\Models\Tag;

class InspectionStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Fetch all the necessary behaviors and the new tags
        $behaviors = Behavior::whereIn('scope', ['inspection', 'universal'])->get()->keyBy('name');
        $tags = Tag::all()->keyBy('slug');

        // --- Status: OK ---
        InspectionStatus::firstOrCreate(['name' => 'OK'], [
            'severity' => 0,
            'bg_color' => '#00fa96',
            'text_color' => '#166534',
        ]);

        // --- Status: Needs Attention ---
        $needsAttention = InspectionStatus::firstOrCreate(['name' => 'Needs Attention'], [
            'severity' => 1,
            'bg_color' => '#ffe600',
            'text_color' => '#854d0e',
        ]);
        // Attach the behaviors using the pivot table with the new 'tag_id'
        $needsAttention->behaviors()->sync([
            $behaviors['creates_ticket_sev1']->id => [],
            $behaviors['applies_machine_tag']->id => [
                'tag_id' => $tags['open-ticket']->id,
            ],
        ]);

        // --- Status: Critical Failure ---
        $criticalFailure = InspectionStatus::firstOrCreate(['name' => 'Critical Failure'], [
            'severity' => 2,
            'bg_color' => '#ff6368',
            'text_color' => '#991b1b',
        ]);
        $criticalFailure->behaviors()->sync([
            $behaviors['creates_ticket_sev2']->id => [],
            $behaviors['applies_machine_tag']->id => [
                'tag_id' => $tags['out-of-service']->id,
            ],
        ]);

        $this->command->info('Inspection statuses and their behaviors seeded successfully.');
    }
}
