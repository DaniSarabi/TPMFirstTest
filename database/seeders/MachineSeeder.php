<?php

namespace Database\Seeders;

use App\Models\Machine;
use App\Models\MachineStatus;
use App\Models\User;
use Illuminate\Database\Seeder;

class MachineSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        // Fetch the necessary records created by other seeders
        $maintenanceUser = User::where('email', 'maintenance@tpm.com')->first();
        $statuses = MachineStatus::all()->keyBy('name');

        if (! $maintenanceUser || $statuses->isEmpty()) {
            $this->command->error('Prerequisite data not found. Please run UserSeeder and MachineStatusSeeder first.');

            return;
        }

        $this->command->info('Creating realistic sample machines...');

        // --- Create Sample Machines ---
        Machine::firstOrCreate(['name' => 'CNC Lathe TX-200'], [
            'description' => 'High-precision lathe for metal parts production.',
            'machine_status_id' => $statuses['In Service']->id,
            'image_url' => '/storage/images/cnc-lathe.jpg',
            'created_by' => $maintenanceUser->id,
        ]);

        Machine::firstOrCreate(['name' => 'Stamping Press P-50'], [
            'description' => '50-ton hydraulic press for sheet metal forming.',
            'machine_status_id' => $statuses['Needs Maintenance']->id,
            'image_url' => '/storage/images/stamping-press.jpg',
            'created_by' => $maintenanceUser->id,
        ]);

        Machine::firstOrCreate(['name' => 'Welding Robot WR-5000'], [
            'description' => '6-axis robotic arm for automated welding.',
            'machine_status_id' => $statuses['In Service']->id,
            'image_url' => '/storage/images/welding-robot.jpg',
            'created_by' => $maintenanceUser->id,
        ]);

        Machine::firstOrCreate(['name' => 'Main Assembly Conveyor'], [
            'description' => 'Transports parts between assembly stations.',
            'machine_status_id' => $statuses['Out of Service']->id,
            'image_url' => '/storage/images/conveyor-belt.jpg',
            'created_by' => $maintenanceUser->id,
        ]);

        $this->command->info('Sample machines created successfully.');
    }
}
