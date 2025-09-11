<?php

namespace Database\Seeders;

use App\Models\Behavior;
use App\Models\TicketStatus;
use Illuminate\Database\Seeder;
use App\Models\Tag;

class TicketStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Fetch all necessary behaviors and tags, keyed by their unique identifier for easy access.
        $behaviors = Behavior::all()->keyBy('name');
        $tags = Tag::all()->keyBy('slug');

        // --- Status: Open ---
        $open = TicketStatus::firstOrCreate(['name' => 'Open'], [
            'bg_color' => '#dbeafe',
            'text_color' => '#1e40af',
        ]);
        // ACTION: Apply the new system-critical behaviors.
        // This is now the official starting status for all tickets and cannot be deleted.
        $open->behaviors()->sync([
            $behaviors['is_opening_status']->id => [],
            $behaviors['is_protected']->id => [],
        ]);

        // --- Status: In Progress ---
        $inProgress = TicketStatus::firstOrCreate(['name' => 'In Progress'], [
            'bg_color' => '#fef9c3',
            'text_color' => '#854d0e',
        ]);
        // ACTION: This is now the official "in progress" status and is protected.
        $inProgress->behaviors()->sync([
            $behaviors['is_in_progress_status']->id => [],
            $behaviors['is_protected']->id => [],
        ]);

        // --- Status: Awaiting Parts ---
        $awaitingParts = TicketStatus::firstOrCreate(['name' => 'Awaiting Parts'], [
            'bg_color' => '#fed7aa',
            'text_color' => '#9a3412',
        ]);
        // ACTION: Refactored to detach and then attach to handle multiple rules correctly.
        $awaitingParts->behaviors()->detach();
        $awaitingParts->behaviors()->attach($behaviors['applies_machine_tag']->id, ['tag_id' => $tags['awaiting-parts']->id]);
        $awaitingParts->behaviors()->attach($behaviors['is_protected']->id);


        // --- Status: Resolved ---
        $resolved = TicketStatus::firstOrCreate(['name' => 'Resolved'], [
            'bg_color' => '#dcfce7',
            'text_color' => '#166534',
        ]);
        // ACTION: This is now the official closing status and is protected.
        $resolved->behaviors()->sync([
            $behaviors['is_ticket_closing_status']->id => [],
            $behaviors['is_protected']->id => [],
        ]);


        $discarted = TicketStatus::firstOrCreate(['name' => 'Discarded'], [
            'bg_color' => '#fca5a5',
            'text_color' => '#991b1b',
        ]);
        $discarted->behaviors()->sync([
            $behaviors['is_ticket_discard_status']->id => [],
            $behaviors['']->id => [],
        ]);
        

        // Note: The 'Awaiting Critical Parts' status is removed as its functionality is now
        // handled by combining 'Awaiting Parts' logic with an 'out-of-service' tag,
        // which would be applied by a severe Inspection Status.

        $this->command->info('Ticket statuses and their behaviors seeded successfully.');
    }
}
