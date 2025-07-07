<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Machine;
use App\Models\Subsystem;
use App\Models\InspectionPoint;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;


class MachineModuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // --- 1. Create Maintenance Role and Assign Permissions ---
        $maintenanceRole = Role::firstOrCreate(['name' => 'maintenance']);

        $machinePermissions = [
            'machines.view',
            'machines.create',
            'machines.edit',
            'machines.delete',
        ];

        foreach ($machinePermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $maintenanceRole->syncPermissions($machinePermissions);
        $this->command->info('Maintenance role and permissions synced successfully.');

        // --- 2. Create the Maintenance User ---
        $maintenanceUser = User::firstOrCreate(
            ['email' => 'maintenance@tpm.com'],
            [
                'name' => 'Maintenance User',
                'password' => Hash::make('password'),
            ]
        )->assignRole($maintenanceRole);
        $this->command->info('Maintenance user created and role assigned.');

        // --- 3. Create Sample Machines Manually ---
        $this->command->info('Creating realistic sample machines...');

        // --- Machine 1: CNC Lathe ---
        $cncLathe = Machine::create([
            'name' => 'CNC Lathe TX-200',
            'description' => 'High-precision lathe for metal parts production.',
            'status' => 'In Service',
            'image_url' => '/storage/images/cnc-lathe.png',
            'created_by' => $maintenanceUser->id,
        ]);
        $spindle = $cncLathe->subsystems()->create(['name' => 'Spindle System']);
        $spindle->inspectionPoints()->create(['name' => 'Check spindle lubrication level', 'description' => 'Ensure oil is between min and max lines in the sight glass.']);
        $spindle->inspectionPoints()->create(['name' => 'Listen for unusual noises', 'description' => 'Report any grinding, high-pitched sounds, or excessive vibration.']);

        $coolant = $cncLathe->subsystems()->create(['name' => 'Coolant System']);
        $coolant->inspectionPoints()->create(['name' => 'Check coolant concentration', 'description' => 'Use refractometer. Target concentration is 8-10%.']);
        $coolant->inspectionPoints()->create(['name' => 'Clean coolant filters', 'description' => 'Remove and clean primary and secondary filters of metal chips.']);

        // --- Machine 2: Stamping Press ---
        $stampingPress = Machine::create([
            'name' => 'Stamping Press P-50',
            'description' => '50-ton hydraulic press for sheet metal forming.',
            'status' => 'Under Maintenance',
            'image_url' => '/storage/images/stamping-press.png',
            'created_by' => $maintenanceUser->id,
        ]);
        $hydraulics = $stampingPress->subsystems()->create(['name' => 'Hydraulic System']);
        $hydraulics->inspectionPoints()->create(['name' => 'Inspect for hydraulic fluid leaks', 'description' => 'Check all hoses, fittings, and cylinder seals for any signs of drips or moisture.']);
        $hydraulics->inspectionPoints()->create(['name' => 'Check hydraulic pressure gauge', 'description' => 'Verify pressure is within the operational range (2000-2500 PSI).']);

        $dieArea = $stampingPress->subsystems()->create(['name' => 'Die & Bolster Area']);
        $dieArea->inspectionPoints()->create(['name' => 'Ensure die area is clear of debris', 'description' => 'Remove any scrap metal, tools, or foreign objects before operation.']);

        // --- Machine 3: Welding Robot ---
        $weldingRobot = Machine::create([
            'name' => 'Welding Robot WR-5000',
            'description' => '6-axis robotic arm for automated welding.',
            'status' => 'In Service',
            'image_url' => '/storage/images/welding-robot.png',
            'created_by' => $maintenanceUser->id,
        ]);
        $robotArm = $weldingRobot->subsystems()->create(['name' => 'Robotic Arm Assembly']);
        $robotArm->inspectionPoints()->create(['name' => 'Check for frayed cables or hoses', 'description' => 'Inspect the entire length of the arm for any signs of wear or damage.']);

        $torch = $weldingRobot->subsystems()->create(['name' => 'Welding Torch & Wire Feeder']);
        $torch->inspectionPoints()->create(['name' => 'Clean torch tip and nozzle', 'description' => 'Remove spatter buildup from the nozzle and contact tip.']);
        $torch->inspectionPoints()->create(['name' => 'Verify wire feed tension', 'description' => 'Ensure the wire feeds smoothly without slipping or binding.']);

        // --- Machine 4: Conveyor Belt ---
        $conveyor = Machine::create([
            'name' => 'Main Assembly Conveyor',
            'description' => 'Transports parts between assembly stations.',
            'status' => 'Out of Service',
            'image_url' => '/storage/images/conveyor-belt.png',
            'created_by' => $maintenanceUser->id,
        ]);
        $drive = $conveyor->subsystems()->create(['name' => 'Motor & Drive System']);
        $drive->inspectionPoints()->create(['name' => 'Check motor temperature', 'description' => 'Use an infrared thermometer. Report temperatures above 80°C.']);
        $drive->inspectionPoints()->create(['name' => 'Listen for gearbox noise', 'description' => 'Report any loud whining or clunking sounds.']);

        $this->command->info('Sample machines created successfully.');
    }
}
