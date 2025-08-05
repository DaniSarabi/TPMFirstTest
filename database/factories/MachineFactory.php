<?php

namespace Database\Factories;

use App\Models\MachineStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Machine>
 */
class MachineFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->company().' Press',
            'description' => $this->faker->sentence(),
            // Ensure a user and a status exist before creating the machine
            'created_by' => User::factory(),
            'machine_status_id' => MachineStatus::factory(),
        ];
    }
}
