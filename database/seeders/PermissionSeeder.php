<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // It's a good practice to reset the permission cache before seeding
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // --- 1. Create Permissions ---
        // Your existing list of permissions
        $permissions = [
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',

            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
        ];

        // Loop through permissions and create them if they don't exist
        foreach ($permissions as $permissionName) {
            // firstOrCreate finds the permission or creates it if it doesn't exist
            Permission::firstOrCreate(['name' => $permissionName]);
        }

        // --- 2. Create Roles ---
        // Create a Super-Admin role if it doesn't exist
        $superAdminRole = Role::firstOrCreate(['name' => 'Super-Admin']);

        // --- 3. Assign Permissions to Roles ---
        // Give all permissions to the Super-Admin role
        $superAdminRole->givePermissionTo(Permission::all());

        // You could also create other roles and assign specific permissions
        // $userRole = Role::firstOrCreate(['name' => 'User']);
        // $userRole->givePermissionTo(['users.view', 'roles.view']);


        // --- 4. Create the Admin User ---
        // Use firstOrCreate to prevent creating the user if they already exist
        $adminUser = User::firstOrCreate(
            ['email' => 'angel@jstpower.com'], // Find user by email
            [
                'name' => 'Angel Admin', // Data to use if creating a new user
                'password' => Hash::make('password'), // Hash the password
            ]
        );

        // --- 5. Assign Role to User ---
        // Assign the Super-Admin role to the user
        $adminUser->assignRole($superAdminRole);
    }
}
