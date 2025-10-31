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
        // --- PRECAUCIÓN ---
        // Asume que estos 'name' y 'slug' existen en 'behaviors' y 'tags'
        //
        // Behaviors (names):
        // 'is_opening_status', 'is_protected', 'is_in_progress_status',
        // 'applies_machine_tag', 'is_ticket_closing_status', 'is_ticket_discard_status',
        // 'awaits_non_critical_parts', 'awaits_critical_parts',
        //
        // Tags (slugs):
        // 'awaiting-parts', 'out-of-service', 'diagnostic', // <-- Nuevo
        // 'awaiting-quote', 'awaiting-purchase', 'external-vendor' // <-- Nuevos
        // ---

        $behaviors = Behavior::all()->keyBy('name');
        $tags = Tag::all()->keyBy('slug');

        // --- Status: Open ---
        $open = TicketStatus::firstOrCreate(['name' => 'Open'], [
            'bg_color' => '#00d4ff',
            'text_color' => '#004553',
        ]);
        $open->behaviors()->sync([
            $behaviors['is_opening_status']->id => [],
            $behaviors['is_protected']->id => [],
        ]);

        // --- Status: In Progress ---
        $inProgress = TicketStatus::firstOrCreate(['name' => 'In Progress'], [
            'bg_color' => '#ffe600',
            'text_color' => '#6a5e00',
        ]);
        $inProgress->behaviors()->sync([
            $behaviors['is_in_progress_status']->id => [],
            $behaviors['is_protected']->id => [],
        ]);
        
        // --- NUEVO ESTADO DE DIAGNÓSTICO ---
        $diagnostic = TicketStatus::firstOrCreate(['name' => 'En Diagnóstico'], [
            'bg_color' => '#fde047', // Amarillo un poco más pálido
            'text_color' => '#713f12',
        ]);
        $diagnostic->behaviors()->detach();
        $diagnostic->behaviors()->attach($behaviors['is_in_progress_status']->id); // <-- Behavior nuevo
        $diagnostic->behaviors()->attach($behaviors['applies_machine_tag']->id, ['tag_id' => $tags['diagnostic']->id]);
        $diagnostic->behaviors()->attach($behaviors['is_protected']->id);


        // --- ESTADOS "LEGACY"  ---

        // --- Status: Awaiting Parts (Non-Critical) ---
        $awaitingParts = TicketStatus::firstOrCreate(['name' => 'Awaiting Parts'], [
            'bg_color' => '#fed7aa',
            'text_color' => '#9a3412',
        ]);
        $awaitingParts->behaviors()->detach(); 
        $awaitingParts->behaviors()->attach($behaviors['applies_machine_tag']->id, ['tag_id' => $tags['awaiting-parts']->id]);
        $awaitingParts->behaviors()->attach($behaviors['is_protected']->id);
        $awaitingParts->behaviors()->attach($behaviors['awaits_non_critical_parts']->id); // <-- Behavior viejo


        // --- Status: Awaiting Critical Parts ---
        $awaitingCritParts = TicketStatus::firstOrCreate(['name' => 'Awaiting Critical Parts'], [
            'bg_color' => '#fca5a5',
            'text_color' => '#991b1b',
        ]);
        $awaitingCritParts->behaviors()->detach(); 
        $awaitingCritParts->behaviors()->attach($behaviors['applies_machine_tag']->id, ['tag_id' => $tags['awaiting-parts']->id]);
        $awaitingCritParts->behaviors()->attach($behaviors['applies_machine_tag']->id, ['tag_id' => $tags['out-of-service']->id]);
        $awaitingCritParts->behaviors()->attach($behaviors['awaits_critical_parts']->id); // <-- Behavior viejo
        $awaitingCritParts->behaviors()->attach($behaviors['is_protected']->id);


        // --- NUEVOS ESTADOS DE STAND-BY (con behavior genérico) ---

        // --- Status: En Espera de Cotización ---
        $awaitQuote = TicketStatus::firstOrCreate(['name' => 'En Espera de Cotización'], [
            'bg_color' => '#c4b5fd', // Morado claro
            'text_color' => '#5b21b6', // Morado oscuro
        ]);
        $awaitQuote->behaviors()->detach();
        $awaitQuote->behaviors()->attach($behaviors['is_stand_by_status']->id); // <-- Behavior genérico
        $awaitQuote->behaviors()->attach($behaviors['applies_machine_tag']->id, ['tag_id' => $tags['awaiting-quote']->id]);
        $awaitQuote->behaviors()->attach($behaviors['is_protected']->id);

        // --- Status: En Espera de Compra ---
        $awaitPurchase = TicketStatus::firstOrCreate(['name' => 'En Espera de Compra'], [
            'bg_color' => '#a5f3fc', // Cyan claro
            'text_color' => '#0e7490', // Cyan oscuro
        ]);
        $awaitPurchase->behaviors()->detach();
        $awaitPurchase->behaviors()->attach($behaviors['is_stand_by_status']->id); // <-- Behavior genérico
        $awaitPurchase->behaviors()->attach($behaviors['applies_machine_tag']->id, ['tag_id' => $tags['awaiting-purchase']->id]);
        $awaitPurchase->behaviors()->attach($behaviors['is_protected']->id);
        
        // --- Status: En Espera de Proveedor Externo ---
        $awaitVendor = TicketStatus::firstOrCreate(['name' => 'En Espera de Proveedor Externo'], [
            'bg_color' => '#fdba74', // Naranja claro
            'text_color' => '#7c2d12', // Naranja oscuro
        ]);
        $awaitVendor->behaviors()->detach();
        $awaitVendor->behaviors()->attach($behaviors['is_stand_by_status']->id); // <-- Behavior genérico
        $awaitVendor->behaviors()->attach($behaviors['applies_machine_tag']->id, ['tag_id' => $tags['external-vendor']->id]);
        $awaitVendor->behaviors()->attach($behaviors['is_protected']->id);


        // --- ESTADOS DE CIERRE ---

        // --- Status: Resolved ---
        $resolved = TicketStatus::firstOrCreate(['name' => 'Resolved'], [
            'bg_color' => '#00fa96',
            'text_color' => '#006a3b',
        ]);
        $resolved->behaviors()->sync([
            $behaviors['is_ticket_closing_status']->id => [],
            $behaviors['is_protected']->id => [],
        ]);

        // --- Status: Discarded ---
        $discarted = TicketStatus::firstOrCreate(['name' => 'Discarded'], [
            'bg_color' => '#d1d5db',
            'text_color' => '#374151',
        ]);
        $discarted->behaviors()->sync([
            $behaviors['is_ticket_discard_status']->id => [],
            $behaviors['is_protected']->id => [],
        ]);

        $this->command->info('Ticket statuses and their behaviors seeded successfully.');
    }
}