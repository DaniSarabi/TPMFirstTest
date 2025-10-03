<?php

namespace Database\Seeders;

use App\Models\Machine;
use App\Models\User;
use Illuminate\Database\Seeder;

class OvenMachineSeeder extends Seeder
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

        // Create the Oven machine
        $oven = Machine::updateOrCreate(
            ['name' => 'Curing Oven'],
            [
                'description' => 'Industrial oven used for curing coils and other components, ensuring material integrity through controlled temperature cycles.',
                'created_by' => $user->id,
            ]
        );

        // Define the subsystems and their inspection points in English
        $subsystems = [
            'Mechanical & Structural System' => [
                ['name' => 'Verify door opens and closes correctly; apply grease to guides if necessary'],
                ['name' => 'Verify the seal of doors and gaskets to prevent thermal leaks'],
                ['name' => 'Check the loading rails or platform for coils (alignment)'],
                ['name' => 'General inspection of the oven structure is in good condition'],
            ],
            'Control & Electrical System' => [
                ['name' => 'Check the control screen and buttons on the main panel are functional'],
                ['name' => 'Check on the screen that resistances, thermocouples, extractors are working when temperatures are on'],
                ['name' => 'Verify that the traffic light and internal oven lights work correctly'],
                ['name' => 'Confirm that the system allows recording of operational data (time, temperature, cycles)'],
            ],
            'Safety & Sensor System' => [
                ['name' => 'Check that the limit sensors function correctly when opening and closing the door'],
                ['name' => 'Check that the safety curtains, switches, and emergency stop buttons work correctly'],
            ],
        ];

        foreach ($subsystems as $subsystemName => $points) {
            $subsystem = $oven->subsystems()->updateOrCreate(['name' => $subsystemName]);

            foreach ($points as $pointData) {
                // The description will be null by default
                $subsystem->inspectionPoints()->updateOrCreate(
                    ['name' => $pointData['name']]
                );
            }
        }
    }
}
