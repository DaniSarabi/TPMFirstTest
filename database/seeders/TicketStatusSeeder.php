<?php

namespace Database\Seeders;

use App\Models\Behavior;
use App\Models\MachineStatus;
use App\Models\TicketStatus;
use Illuminate\Database\Seeder;

class TicketStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Fetch all necessary behaviors and machine statuses
        $behaviors = Behavior::all()->keyBy('name');
        $machineStatuses = MachineStatus::all()->keyBy('name');

        // --- Status: Open ---
        TicketStatus::firstOrCreate(['name' => 'Open'], [
            'bg_color' => '#dbeafe',
            'text_color' => '#1e40af',
        ]);

        // --- Status: In Progress ---
        $inProgress = TicketStatus::firstOrCreate(['name' => 'In Progress'], [
            'bg_color' => '#fef9c3',
            'text_color' => '#854d0e',
        ]);
        // Attach the behavior to log maintenance downtime
        $inProgress->behaviors()->sync([
            $behaviors['triggers_downtime_maintenance']->id => [],
        ]);

        // --- Status: Awaiting Parts ---
        $awaitingParts = TicketStatus::firstOrCreate(['name' => 'Awaiting Parts'], [
            'bg_color' => '#fed7aa',
            'text_color' => '#9a3412',
        ]);
        $awaitingParts->behaviors()->sync([
            $behaviors['sets_machine_status']->id => ['machine_status_id' => $machineStatuses['Awaiting Parts - Running']->id],
            $behaviors['triggers_downtime_parts']->id => [],
        ]);

        // --- Status: Awaiting Critical Parts ---
        $awaitingCritical = TicketStatus::firstOrCreate(['name' => 'Awaiting Critical Parts'], [
            'bg_color' => '#fca5a5',
            'text_color' => '#991b1b',
        ]);
        $awaitingCritical->behaviors()->sync([
            $behaviors['sets_machine_status']->id => ['machine_status_id' => $machineStatuses['Awaiting Parts - Down']->id],
            $behaviors['triggers_downtime_parts']->id => [],
        ]);

        // --- Status: Resolved ---
        $resolvedStatus = TicketStatus::firstOrCreate(['name' => 'Resolved'], [
            'bg_color' => '#dcfce7',
            'text_color' => '#166534',
        ]);
        $resolvedStatus->behaviors()->sync([
            $behaviors['is_ticket_closing_status']->id => [],
            // This behavior will be checked by the controller's logic
            $behaviors['sets_machine_status']->id => ['machine_status_id' => $machineStatuses['In Service']->id],
        ]);

        $this->command->info('Ticket statuses and their behaviors seeded successfully.');
    }
}
