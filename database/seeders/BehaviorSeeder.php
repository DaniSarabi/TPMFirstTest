<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Behavior;


class BehaviorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $behaviors = [
            // --- Inspection Status Behaviors ---
            ['name' => 'creates_ticket_sev1','title'=>'Create a Medium Priority Ticket' , 'description' => 'Automatically creates a new maintenance ticket with a "Medium" priority.', 'scope' => 'inspection'],
            ['name' => 'creates_ticket_sev2' ,'title'=>'Create a High Priority Ticket', 'description' => 'Automatically creates a new maintenance ticket with a "High" priority.', 'scope' => 'inspection'],
            
            // --- Universal Behavior ---
            ['name' => 'sets_machine_status','title'=>'Change Machine Status ' , 'description' => 'When this status is applied, it will automatically change the machine\'s main operational status.', 'scope' => 'universal'],

            // --- Ticket Status Behaviors ---
            ['name' => 'is_ticket_closing_status','title'=>'Is a Closing Status' , 'description' => 'Marks a ticket as "Resolved" or "Closed". There can only be one of these.', 'scope' => 'ticket'],
            ['name' => 'triggers_downtime_parts','title'=>'Log Downtime (Awaiting Parts)', 'description' => 'When a ticket is set to this status, it automatically starts a downtime log with the reason "Awaiting Parts".', 'scope' => 'ticket'],
            ['name' => 'triggers_downtime_maintenance','title'=>'Log Downtime (Maintenance)' , 'description' => 'When a ticket is set to this status, it automatically starts a downtime log with the reason "Maintenance".', 'scope' => 'ticket'],
        ];

        foreach ($behaviors as $behavior) {
            Behavior::firstOrCreate(['name' => $behavior['name']], $behavior);
        }

        $this->command->info('Application behaviors seeded successfully.');
    }
}
