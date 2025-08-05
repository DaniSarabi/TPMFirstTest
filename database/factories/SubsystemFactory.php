<?php

namespace Database\Factories;

use App\Models\Machine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Subsystem>
 */
class SubsystemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->word().' System',
            'description' => $this->faker->sentence(),
            // Ensure a machine exists before creating the subsystem
            'machine_id' => Machine::factory(),
        ];
    }
}
