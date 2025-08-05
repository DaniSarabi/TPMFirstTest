<?php

namespace Database\Factories;

use App\Models\Subsystem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InspectionPoint>
 */
class InspectionPointFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'Check '.$this->faker->word(),
            'description' => $this->faker->sentence(),
            // Ensure a subsystem exists before creating the inspection point
            'subsystem_id' => Subsystem::factory(),
        ];
    }
}
