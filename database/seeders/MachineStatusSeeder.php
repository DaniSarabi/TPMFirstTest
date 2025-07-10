<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\MachineStatus;


class MachineStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $statuses = [
            ['name' => 'New', 'bg_color' => '#93c5fd', 'text_color' => '#1e40af'], // blue-300 / blue-800
            ['name' => 'In Service', 'bg_color' => '#a7f3d0', 'text_color' => '#065f46'], // green-200 / green-800
            ['name' => 'Needs Maintenance', 'bg_color' => '#fef08a', 'text_color' => '#854d0e'], // yellow-200 / yellow-800
            ['name' => 'Out of Service', 'bg_color' => '#fecaca', 'text_color' => '#991b1b'], // red-200 / red-800
        ];

        foreach ($statuses as $status) {
            MachineStatus::firstOrCreate(['name' => $status['name']], $status);
        }

        $this->command->info('Machine statuses seeded successfully.');
    }
}
