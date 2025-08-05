<?php

namespace Database\Seeders;

use App\Models\MachineStatus;
use Illuminate\Database\Seeder;

class MachineStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $statuses = [
            ['name' => 'New', 'description' => 'Default status for new machines', 'bg_color' => '#93c5fd', 'text_color' => '#1e40af'], // blue-300 / blue-800
            ['name' => 'In Service', 'description' => 'Status for active machines', 'bg_color' => '#a7f3d0', 'text_color' => '#065f46'], // green-200 / green-800
            ['name' => 'Needs Maintenance', 'description' => 'Status for machines needing maintenance', 'bg_color' => '#fef08a', 'text_color' => '#854d0e'], // yellow-200 / yellow-800
            ['name' => 'Out of Service', 'description' => 'Status for machines that are out of service', 'bg_color' => '#fecaca', 'text_color' => '#991b1b'], // red-200 / red-800
            ['id' => 5, 'name' => 'Awaiting Parts - Running', 'description' => 'Status for machines awaiting parts', 'bg_color' => '#fed7aa', 'text_color' => '#9a3412'], // Orange
            ['id' => 6, 'name' => 'Awaiting Parts - Down', 'description' => 'Status for machines awaiting parts', 'bg_color' => '#fca5a5', 'text_color' => '#991b1b'], // Lighter Red
        ];

        foreach ($statuses as $status) {
            MachineStatus::firstOrCreate(['name' => $status['name']], $status);
        }

        $this->command->info('Machine statuses seeded successfully.');
    }
}
