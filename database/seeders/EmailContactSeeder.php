<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\EmailContact;

class EmailContactSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $contacts = [
            [
                'name' => 'IT Nogales',
                'email' => 'it-nogales@jstpower.com',
                'department' => 'Purchasing',
            ],
            [
                'name' => 'Alondra Moguel',
                'email' => 'amoguel@jstpower.com',
                'department' => 'Purchasing',
            ],
            [
                'name' => 'Maintenance Manager',
                'email' => 'manager@example.com',
                'department' => 'Management',
            ],
        ];

        foreach ($contacts as $contact) {
            EmailContact::firstOrCreate(['email' => $contact['email']], $contact);
        }

        $this->command->info('Email contacts seeded successfully.');
    }
}
