<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InspectionStatus>
 */
class InspectionStatusFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->word(),
            'severity' => $this->faker->numberBetween(0, 2),
            'auto_creates_ticket' => $this->faker->boolean(),
            'sets_machine_status_to' => null,
            'bg_color' => $this->faker->hexColor(),
            'text_color' => $this->faker->hexColor(),
            'is_default' => false,
        ];
    }
}
