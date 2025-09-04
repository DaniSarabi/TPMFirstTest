<?php

namespace Database\Seeders;

use App\Models\Behavior;
use Illuminate\Database\Seeder;

class BehaviorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $behaviors = [
            // --- Inspection Status Behaviors ---
            ['name' => 'creates_ticket_sev1', 'title' => 'Create a Medium Priority Ticket', 'description' => 'Automatically creates a new maintenance ticket with a "Medium" priority.', 'scope' => 'inspection'],
            ['name' => 'creates_ticket_sev2', 'title' => 'Create a High Priority Ticket', 'description' => 'Automatically creates a new maintenance ticket with a "High" priority.', 'scope' => 'inspection'],

            // --- Universal Behavior ---
            ['name' => 'applies_machine_tag', 'title' => 'Applies a Machine Tag ', 'description' => 'When this status is applied, it will add a specific tag to the associated machine.', 'scope' => 'universal'],

            // --- Ticket Status Behaviors ---
            ['name' => 'is_ticket_closing_status', 'title' => 'Is a Closing Status', 'description' => 'Marks a ticket as "Resolved" or "Closed". There can only be one of these.', 'scope' => 'ticket'],
            ['name' => 'awaits_non_critical_parts', 'title' => 'Awaits Non-Critical Parts', 'description' => 'Indicates the ticket is paused while waiting for parts, but the machine is still running.', 'scope' => 'ticket'],
            ['name' => 'awaits_critical_parts', 'title' => 'Awaits Critical Parts', 'description' => 'Indicates the ticket is paused while waiting for parts and the machine is down.', 'scope' => 'ticket'],
       
            ['name' => 'is_protected', 'title' => 'Is a Protected Status', 'description' => 'A status with this behavior cannot be deleted from the system.', 'scope' => 'ticket'],
            ['name' => 'is_opening_status', 'title' => 'Is the Opening Status', 'description' => 'Marks this status as the default for all newly created tickets. There can only be one of these.', 'scope' => 'ticket'],
            ['name' => 'is_in_progress_status', 'title' => 'Is an In-Progress Status', 'description' => 'Marks a ticket as being actively worked on.', 'scope' => 'ticket'],

        ];

        foreach ($behaviors as $behavior) {
            Behavior::firstOrCreate(['name' => $behavior['name']], $behavior);
        }


        $this->command->info('Application behaviors seeded successfully.');
    }
}
