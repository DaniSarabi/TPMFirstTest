<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        // --- 1. Create Roles ---
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $maintenanceRole = Role::firstOrCreate(['name' => 'maintenance']);
        $userRole = Role::firstOrCreate(['name' => 'user']);

        // --- 2. Assign Permissions to Roles ---
        $adminRole->syncPermissions(Permission::all());

        $managerRole->syncPermissions([
            'users.view', 'users.create',
            'roles.view', 'roles.create',
            'machines.view', 'machines.create',
        ]);

        $maintenanceRole->syncPermissions([
            'machines.view', 'machines.create', 'machines.edit', 'machines.delete',
        ]);

        $userRole->syncPermissions([
            'machines.view',
        ]);

        $this->command->info('Roles created and permissions assigned successfully.');

        // --- 3. Create Users and Assign Roles ---
        User::firstOrCreate(
            ['email' => 'admin@tpm.com'],
            ['name' => 'Admin User', 'password' => Hash::make('password')]
        )->assignRole($adminRole);

        User::firstOrCreate(
            ['email' => 'manager@tpm.com'],
            ['name' => 'Manager User', 'password' => Hash::make('password')]
        )->assignRole($managerRole);

        User::firstOrCreate(
            ['email' => 'maintenance@tpm.com'],
            ['name' => 'Maintenance User', 'password' => Hash::make('password')]
        )->assignRole($maintenanceRole);

        User::firstOrCreate(
            ['email' => 'user@tpm.com'],
            ['name' => 'Standard User', 'password' => Hash::make('password')]
        )->assignRole($userRole);

        $this->command->info('Users created and roles assigned successfully.');
    }
}
