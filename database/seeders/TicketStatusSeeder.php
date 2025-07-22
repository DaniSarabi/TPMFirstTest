<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\TicketStatus;

class TicketStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //

        $statuses = [
            [
                'name' => 'Open',
                'bg_color' => '#dbeafe', // Tailwind blue-200
                'text_color' => '#1e40af', // Tailwind blue-800
                'is_closing_status' => false,
            ],
            [
                'name' => 'In Progress',
                'bg_color' => '#fef9c3', // Tailwind yellow-100
                'text_color' => '#854d0e', // Tailwind yellow-800
                'is_closing_status' => false,
            ],
            [
                'name' => 'Resolved',
                'bg_color' => '#dcfce7', // Tailwind green-100
                'text_color' => '#166534', // Tailwind green-800
                'is_closing_status' => true,
            ],
        ];

        foreach ($statuses as $status) {
            TicketStatus::firstOrCreate(['name' => $status['name']], $status);
        }

        $this->command->info('Ticket statuses seeded successfully.');
    }
}
