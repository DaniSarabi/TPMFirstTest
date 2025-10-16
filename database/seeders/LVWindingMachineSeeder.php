<?php

namespace Database\Seeders;

use App\Models\Machine;
use App\Models\User;
use Illuminate\Database\Seeder;

class LVWindingMachineSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure a user exists to associate as the creator
        $user = User::firstOrCreate(['email' => 'admin@tpm.com'], [
            'name' => 'Admin User',
            'password' => bcrypt('password'),
        ]);

        // Create the LV Winding Machine
        $lvWinding = Machine::updateOrCreate(
            ['name' => 'LV Winding Machine II'],
            [
                'description' => 'Automated equipment for the precise winding of copper or aluminum conductors to form the low-voltage (LV) side coils of transformers.',
                'created_by' => $user->id,
            ]
        );

        // Define the subsystems and their inspection points in English
        $subsystems = [
            'Control & Electrical System' => [
                ['name' => 'Verify that control panel buttons work correctly and indicator lights turn on'],
                ['name' => 'Verify emergency stops work correctly'],
                ['name' => 'Verify that the transformer indicators are on'],
            ],
            'Pneumatic & Fluid Systems' => [
                ['name' => 'Verify for leaks (air and oil)'],
                ['name' => 'Verify air supply, manometers, and pneumatic valves are in good condition'],
                ['name' => 'Verify for oil leaks in the speed reducers'],
            ],
            'Mechanical & Lubrication System' => [
                ['name' => 'Check worm screws of the roller mechanism for dirt and lack of lubrication'],
                ['name' => 'Apply grease to the roll holder mechanism, clean excess'],
                ['name' => 'Verify roll holder slide guides for dirt and lack of lubrication'],
                ['name' => 'Verify cutting blade slide guides for dirt and lack of lubrication'],
            ],
            'Welding & Cooling System' => [
                ['name' => 'Verify the slide mechanism of the welding station for dirt and lack of lubrication'],
                ['name' => 'Verify water level in the welding equipment cooler, check for leaks and ensure it\'s above 15 liters'],
                ['name' => 'Verify Argon tank pressure is correct and without leaks, close the valve at the end of the shift'],
            ],
        ];

        foreach ($subsystems as $subsystemName => $points) {
            $subsystem = $lvWinding->subsystems()->updateOrCreate(['name' => $subsystemName]);

            foreach ($points as $pointData) {
                // The description will be null by default
                $subsystem->inspectionPoints()->updateOrCreate(
                    ['name' => $pointData['name']]
                );
            }
        }
    }
}
