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
        // It's a good practice to reset the permission cache before seeding
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // --- 1. Define Permissions ---
        // Add all your application's permissions to this array.
        // You can add more sections as your TPM project grows.
        $permissions = [
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

        // --- 2. Create Permissions if they don't exist ---
        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName, 'guard_name' => 'web']);
        }
        
        $this->command->info('Permissions created successfully.');

        // --- 3. Create the Admin Role and assign all permissions ---
        // Use firstOrCreate to find the role or create it if it doesn't exist
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        
        // Get all permissions and assign them to the admin role
        $allPermissions = Permission::pluck('name')->all();
        $adminRole->syncPermissions($allPermissions);

        $this->command->info('Admin role created and permissions assigned.');

        // --- 4. Create the Admin User ---
        // Use firstOrCreate to prevent creating the user if they already exist
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@tpm.com'], // Find user by email
            [
                'name' => 'Admin User', // Data to use if creating a new user
                'password' => Hash::make('password'), // Hash the password
            ]
        );

        // --- 5. Assign the Admin Role to the User ---
        $adminUser->assignRole($adminRole);

        $this->command->info('Admin user created and assigned the admin role.');
    }
}
