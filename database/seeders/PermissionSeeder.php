<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // --- 1. Define Permissions ---
        // Add all your application's permissions to this array.
        $all_permissions = [
            // User Permissions
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',

            // Role Permissions
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            
            // Machine Permissions
            'machines.view',
            'machines.create',
            'machines.edit',
            'machines.delete',
        ];

        // Create permissions if they don't exist
        foreach ($all_permissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName]);
        }
        $this->command->info('All permissions created successfully.');

        // --- 2. Create Roles ---
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $userRole = Role::firstOrCreate(['name' => 'user']);
        $this->command->info('Roles created successfully.');

        // --- 3. Define Permissions for Each Role ---
        $manager_permissions = [
            'users.view', 'users.create',
            'roles.view', 'roles.create',
            'machines.view', 'machines.create',
        ];

        $user_permissions = [
            'users.view',
            'roles.view',
            'machines.view',
        ];

        // --- 4. Assign Permissions to Roles ---
        $adminRole->syncPermissions($all_permissions);
        $managerRole->syncPermissions($manager_permissions);
        $userRole->syncPermissions($user_permissions);
        $this->command->info('Permissions assigned to roles successfully.');

        // --- 5. Create Users and Assign Roles ---
        // Admin User
        User::firstOrCreate(
            ['email' => 'admin@tpm.com'],
            ['name' => 'Admin User', 'password' => Hash::make('password')]
        )->assignRole($adminRole);

        // Manager User
        User::firstOrCreate(
            ['email' => 'manager@tpm.com'],
            ['name' => 'Manager User', 'password' => Hash::make('password')]
        )->assignRole($managerRole);

        // Standard User
        User::firstOrCreate(
            ['email' => 'user@tpm.com'],
            ['name' => 'Standard User', 'password' => Hash::make('password')]
        )->assignRole($userRole);
        
        $this->command->info('Users created and roles assigned successfully.');
    }
}
