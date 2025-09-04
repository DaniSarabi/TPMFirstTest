<?php

namespace Database\Seeders;

use App\Models\Machine;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;

class MachineSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $maintenanceUser = User::where('email', 'maintenance@tpm.com')->first();
        $tags = Tag::all()->keyBy('slug');

        if (!$maintenanceUser || $tags->isEmpty()) {
            $this->command->error('Prerequisite data not found. Please run UserSeeder and TagSeeder first.');
            return;
        }

        $this->command->info('Creating realistic sample machines with new status and tag system...');

        // --- Create Sample Machines ---
        $lathe = Machine::updateOrCreate(['name' => 'CNC Lathe TX-200'], [
            'description' => 'High-precision lathe for metal parts production.',
            'status' => 'in_service',
            'image_url' => 'images/cnc-lathe.jpg',
            'created_by' => $maintenanceUser->id,
        ]);

        $press = Machine::updateOrCreate(['name' => 'Stamping Press P-50'], [
            'description' => '50-ton hydraulic press for sheet metal forming.',
            'status' => 'in_service', // The machine is still running...
            'image_url' => 'images/stamping-press.jpg',
            'created_by' => $maintenanceUser->id,
        ]);
        // ...but it has a tag indicating it needs maintenance.
        if ($tags->has('needs-maintenance')) {
            $press->tags()->syncWithoutDetaching([$tags['needs-maintenance']->id]);
        }


        $robot = Machine::updateOrCreate(['name' => 'Welding Robot WR-5000'], [
            'description' => '6-axis robotic arm for automated welding.',
            'status' => 'in_service',
            'image_url' => 'images/welding-robot.jpg',
            'created_by' => $maintenanceUser->id,
        ]);

        $conveyor = Machine::updateOrCreate(['name' => 'Main Assembly Conveyor'], [
            'description' => 'Transports parts between assembly stations.',
            'status' => 'out_of_service',
            'image_url' => 'images/conveyor-belt.jpg',
            'created_by' => $maintenanceUser->id,
        ]);
        // Attach tags to explain why it's out of service.
        if ($tags->has('out-of-service') && $tags->has('awaiting-parts')) {
            $conveyor->tags()->syncWithoutDetaching([
                $tags['out-of-service']->id,
                $tags['awaiting-parts']->id,
            ]);
        }


        $this->command->info('Sample machines created successfully.');
    }
}
