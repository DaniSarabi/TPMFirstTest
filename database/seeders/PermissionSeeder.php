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
            // * User Permissions
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',

            // * Role Permissions
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            
            // * Machine Permissions
            'machines.view',
            'machines.create',
            'machines.edit',
            'machines.delete',

            // * Inspections Permissions
            'inspections.view',
            'inspections.perform',
            'inspections.edit',
            'inspections.delete',
            'inspections.administration',

            // * Tickets Permissions
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.delete',

        ];

        // Create permissions if they don't exist
        foreach ($all_permissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName]);
        }
        $this->command->info('All permissions created successfully.');
    }
}
