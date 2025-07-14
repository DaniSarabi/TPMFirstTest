<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\InspectionStatus;


class InspectionStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $statuses = [
            [
                'name' => 'OK',
                'severity' => 0,
                'auto_creates_ticket' => false,
                'sets_machine_status_to' => null,
                'bg_color' => '#00fa96', 
                'text_color' => '#001607', 
                'is_default' => true,
            ],
            [
                'name' => 'Needs Attention',
                'severity' => 1,
                'auto_creates_ticket' => true,
                'sets_machine_status_to' => 'Needs Maintenance',
                'bg_color' => '#ffe600', // Tailwind yellow-100
                'text_color' => '#4a4000', // Tailwind yellow-800
                'is_default' => false,
            ],
            [
                'name' => 'Critical Failure',
                'severity' => 2,
                'auto_creates_ticket' => true,
                'sets_machine_status_to' => 'Out of Service',
                'bg_color' => '#ff4e4e', // Tailwind red-100
                'text_color' => '#1a0000', // Tailwind red-800
                'is_default' => false,
            ],
        ];

        foreach ($statuses as $status) {
            InspectionStatus::firstOrCreate(['name' => $status['name']], $status);
        }

        $this->command->info('Inspection statuses seeded successfully.');
    }
}
