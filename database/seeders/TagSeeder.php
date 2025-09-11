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
                'icon' => 'power-off'
            ],
            [
                'name' => 'Open Ticket',
                'slug' => 'open-ticket',
                'description' => 'An active maintenance ticket is open for this machine.',
                'color' => '#f97316', // Orange
                'icon' => 'ticket'
            ],
            [
                'name' => 'Awaiting Parts',
                'slug' => 'awaiting-parts',
                'description' => 'The machine is waiting for parts to complete a repair.',
                'color' => '#eab308', // Yellow
                'icon' => 'box'
            ],
            [
                'name' => 'Under Maintenance',
                'slug' => 'under-maintenance',
                'description' => 'A maintenance task is currently in progress on this machine.',
                'color' => '#3b82f6', // Blue
                'icon' => 'wrench'
            ],
            [
                'name' => 'Maintenance Due',
                'slug' => 'maintenance-due',
                'description' => 'Preventive maintenance is scheduled and approaching its due date.',
                'color' => '#a855f7', // Purple
                'icon' => 'calendar-clock'
            ],
            [
                'name' => 'Maintenance Overdue',
                'slug' => 'maintenance-overdue',
                'description' => 'Preventive maintenance is past its due date and grace period.',
                'color' => '#be123c', // Dark Red
                'icon' => 'calendar-x'
            ],
            [
                'name' => 'Perfoming Maintenance',
                'slug' => 'in-preventive-maintenance',
                'description' => 'Machine is currently stopped for a scheduled preventive maintenance task.',
                'color' => '#3b82f6', // A distinct blue color
                'icon' => 'Wrench'
            ],
        ];

        foreach ($tags as $tagData) {
            Tag::updateOrCreate(['slug' => $tagData['slug']], $tagData);
        }
    }
}
