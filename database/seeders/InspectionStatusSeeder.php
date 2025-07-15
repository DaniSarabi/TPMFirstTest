<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\InspectionStatus;
use App\Models\MachineStatus;



class InspectionStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $machineStatuses = MachineStatus::all()->keyBy('name');

        if ($machineStatuses->isEmpty()) {
            $this->command->error('Machine statuses not found. Please run the MachineStatusSeeder first.');
            return;
        }
        $statuses = [
            [
                'name' => 'OK',
                'severity' => 0,
                'auto_creates_ticket' => false,
                'machine_status_id' => null,
                'bg_color' => '#00fa96',
                'text_color' => '#001607',
                'is_default' => true,
            ],
            [
                'name' => 'Needs Attention',
                'severity' => 1,
                'auto_creates_ticket' => true,
                'machine_status_id' => $machineStatuses['Needs Maintenance']->id,
                'bg_color' => '#ffe600', // Tailwind yellow-100
                'text_color' => '#4a4000', // Tailwind yellow-800
                'is_default' => false,
            ],
            [
                'name' => 'Critical Failure',
                'severity' => 2,
                'auto_creates_ticket' => true,
                'machine_status_id' => $machineStatuses['Out of Service']->id,
                'bg_color' => '#ff4e4e', // Tailwind red-100
                'text_color' => '#1a0000', // Tailwind red-800
                'is_default' => false,
            ],
        ];

        foreach ($statuses as $status) {
            InspectionStatus::firstOrCreate(['name' => $status['name']], $status);
        }

        $this->command->info('Inspection statuses seeded successfully.');
    }
}
