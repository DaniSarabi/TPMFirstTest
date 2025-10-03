<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);
        // $this->call(PermissionSeeder::class);
        // $this->call(UserSeeder::class);
        // //$this->call(MachineStatusSeeder::class);
        // $this->call(TagSeeder::class);
        // $this->call(MachineSeeder::class);
        // $this->call(SubsystemAndPointsSeeder::class);
        // $this->call(BehaviorSeeder::class);
        // $this->call(InspectionStatusSeeder::class);
        // $this->call(TicketStatusSeeder::class);
        // $this->call(EmailContactSeeder::class);
        // $this->call(HuberMachineSeeder::class);
        $this->call(HVManualWindingSeeder::class);
        $this->call(LVWindingMachineSeeder::class);
        $this->call(OvenMachineSeeder::class);
        //$this->call(NotificationSeeder::class);
        //$this->call(PolicySeeder::class);
        //$this->call(MaintenanceTemplateSeeder::class);
        //$this->call(PreventiveMaintenanceSeeder::class);
    }
}
