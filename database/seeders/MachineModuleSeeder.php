<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Machine;
use App\Models\Subsystem;
use App\Models\InspectionPoint;

class MachineModuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        // Create a sample user to act as the creator
        $user = User::firstOrCreate(
            ['email' => 'admin@tpm.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
            ]
        );

        // --- Machine 1: CNC Lathe ---
        $cncLathe = Machine::create([
            'name' => 'CNC Lathe TX-200',
            'description' => 'High-precision lathe for metal parts.',
            'created_by' => $user->id,
        ]);

        $spindle = Subsystem::create([
            'machine_id' => $cncLathe->id,
            'name' => 'Spindle System',
            'description' => 'Main rotating assembly.'
        ]);

        InspectionPoint::create([
            'subsystem_id' => $spindle->id,
            'name' => 'Check spindle lubrication level',
            'description' => 'Ensure oil is between min and max lines.'
        ]);

        InspectionPoint::create([
            'subsystem_id' => $spindle->id,
            'name' => 'Listen for unusual noises',
            'description' => 'Report any grinding or high-pitched sounds.'
        ]);

        $coolant = Subsystem::create([
            'machine_id' => $cncLathe->id,
            'name' => 'Coolant System',
            'description' => 'Manages fluid for cooling the workpiece.'
        ]);
        
        InspectionPoint::create([
            'subsystem_id' => $coolant->id,
            'name' => 'Check coolant concentration',
            'description' => 'Use refractometer to check concentration.'
        ]);

        // --- Machine 2: Stamping Press ---
        $stampingPress = Machine::create([
            'name' => 'Stamping Press P-50',
            'description' => '50-ton press for sheet metal.',
            'created_by' => $user->id,
        ]);

        $hydraulics = Subsystem::create([
            'machine_id' => $stampingPress->id,
            'name' => 'Hydraulic System',
            'description' => 'Provides the force for the press.'
        ]);

        InspectionPoint::create([
            'subsystem_id' => $hydraulics->id,
            'name' => 'Inspect for hydraulic fluid leaks',
            'description' => 'Check all hoses and connections for drips.'
        ]);
    }
}
