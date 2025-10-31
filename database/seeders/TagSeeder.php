<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Tag;

class TagSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tags = [
            [
                'name' => 'Out of Service',
                'slug' => 'out-of-service',
                'description' => 'The machine is physically stopped and not operational.',
                'color' => '#ef4444', // Red
                'icon' => 'PowerOff'
            ],
            [
                'name' => 'Open Ticket',
                'slug' => 'open-ticket',
                'description' => 'An active ticket is open for this machine.',
                'color' => '#ffce69', // Orange
                'icon' => 'Ticket'
            ],
            [
                'name' => 'Awaiting Parts',
                'slug' => 'awaiting-parts',
                'description' => 'The machine is waiting for parts to complete a repair.',
                'color' => '#eab308', // Yellow
                'icon' => 'Box'
            ],
            [
                'name' => 'Under Maintenance',
                'slug' => 'under-maintenance',
                'description' => 'A maintenance task is currently in progress on this machine.',
                'color' => '#3b82f6', // Blue
                'icon' => 'Wrench'
            ],
            [
                'name' => 'Maintenance Due',
                'slug' => 'maintenance-due',
                'description' => 'Preventive maintenance is scheduled and approaching its due date.',
                'color' => '#a845f7', // Purple
                'icon' => 'CalendarClock'
            ],
            [
                'name' => 'Maintenance Overdue',
                'slug' => 'maintenance-overdue',
                'description' => 'Preventive maintenance is past its due date and grace period.',
                'color' => '#be123c', // Dark Red
                'icon' => 'CalendarX'
            ],


            
            [
                'name' => 'Diagnostic',
                'slug' => 'diagnostic',
                'description' => 'The issue is actively being analyzed or diagnosed.',
                'color' => '#0ea5e9', // Sky 500
                'icon' => 'ClipboardSearch'
            ],
            [
                'name' => 'Awaiting Quote',
                'slug' => 'awaiting-quote',
                'description' => 'Waiting for a price quotation from a supplier.',
                'color' => '#f59e0b', // Amber 500
                'icon' => 'Receipt'
            ],
            [
                'name' => 'Awaiting Purchase',
                'slug' => 'awaiting-purchase',
                'description' => 'Waiting for the purchasing department to approve or make the payment.',
                'color' => '#f97316', // Orange 500
                'icon' => 'Landmark'
            ],
            [
                'name' => 'Awaiting Delivery',
                'slug' => 'awaiting-delivery',
                'description' => 'Parts have been ordered and are in transit.',
                'color' => '#ca8a04', // Yellow 600
                'icon' => 'Truck'
            ],
            [
                'name' => 'External Vendor',
                'slug' => 'external-vendor',
                'description' => 'Waiting for an external contractor or vendor to perform service.',
                'color' => '#6b7280', // Gray 500
                'icon' => 'HardHat'
            ],
        ];

        foreach ($tags as $tagData) {
            Tag::updateOrCreate(['slug' => $tagData['slug']], $tagData);
        }
    }
}
