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
        $this->call(PermissionSeeder::class);
        $this->call(UserSeeder::class);
        $this->call(MachineStatusSeeder::class);
        $this->call(TagSeeder::class);
        $this->call(MachineSeeder::class);
        $this->call(SubsystemAndPointsSeeder::class);
        $this->call(BehaviorSeeder::class);
        $this->call(InspectionStatusSeeder::class);
        $this->call(TicketStatusSeeder::class);
        $this->call(EmailContactSeeder::class);
        $this->call(HuberMachineSeeder::class);
        $this->call(HVManualWindingSeeder::class);
        $this->call(LVWindingMachineSeeder::class);
        $this->call(OvenMachineSeeder::class);
        $this->call(HuberTemplateSeeder::class);
        //$this->call(NotificationSeeder::class);
        //$this->call(PolicySeeder::class);

    }
}
