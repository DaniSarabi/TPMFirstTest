<?php

namespace Database\Seeders;

use App\Models\Machine;
use Illuminate\Database\Seeder;

class SubsystemAndPointsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * This seeder should run AFTER the MachineModuleSeeder.
     */
    public function run(): void
    {
        $this->command->info('Seeding subsystems and inspection points for existing machines...');

        // --- CNC Lathe TX-200 ---
        $cncLathe = Machine::where('name', 'CNC Lathe TX-200')->first();
        if ($cncLathe) {
            $spindle = $cncLathe->subsystems()->firstOrCreate(['name' => 'Spindle System']);
            $spindle->inspectionPoints()->firstOrCreate(['name' => 'Check spindle lubrication level'], ['description' => 'Ensure oil is between min and max lines.']);
            $spindle->inspectionPoints()->firstOrCreate(['name' => 'Listen for unusual noises'], ['description' => 'Report any grinding or high-pitched sounds.']);

            $coolant = $cncLathe->subsystems()->firstOrCreate(['name' => 'Coolant System']);
            $coolant->inspectionPoints()->firstOrCreate(['name' => 'Check coolant concentration'], ['description' => 'Use refractometer. Target is 8-10%.']);
        }

        // --- Stamping Press P-50 ---
        $stampingPress = Machine::where('name', 'Stamping Press P-50')->first();
        if ($stampingPress) {
            $hydraulics = $stampingPress->subsystems()->firstOrCreate(['name' => 'Hydraulic System']);
            $hydraulics->inspectionPoints()->firstOrCreate(['name' => 'Inspect for hydraulic fluid leaks'], ['description' => 'Check hoses and cylinder seals.']);

            $dieArea = $stampingPress->subsystems()->firstOrCreate(['name' => 'Die & Bolster Area']);
            $dieArea->inspectionPoints()->firstOrCreate(['name' => 'Ensure die area is clear of debris'], ['description' => 'Remove any scrap metal or tools.']);
        }

        // --- Welding Robot WR-5000 ---
        $weldingRobot = Machine::where('name', 'Welding Robot WR-5000')->first();
        if ($weldingRobot) {
            $robotArm = $weldingRobot->subsystems()->firstOrCreate(['name' => 'Robotic Arm Assembly']);
            $robotArm->inspectionPoints()->firstOrCreate(['name' => 'Check for frayed cables or hoses'], ['description' => 'Inspect the entire length for wear or damage.']);

            $torch = $weldingRobot->subsystems()->firstOrCreate(['name' => 'Welding Torch & Wire Feeder']);
            $torch->inspectionPoints()->firstOrCreate(['name' => 'Clean torch tip and nozzle'], ['description' => 'Remove spatter buildup.']);
        }

        // --- Main Assembly Conveyor ---
        $conveyor = Machine::where('name', 'Main Assembly Conveyor')->first();
        if ($conveyor) {
            $drive = $conveyor->subsystems()->firstOrCreate(['name' => 'Motor & Drive System']);
            $drive->inspectionPoints()->firstOrCreate(['name' => 'Check motor temperature'], ['description' => 'Use infrared thermometer. Report temps > 80°C.']);
        }

        $this->command->info('Subsystems and inspection points seeded successfully.');
    }
}
