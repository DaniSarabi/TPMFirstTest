<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MachineStatus>
 */
class MachineStatusFactory extends Factory
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
            'bg_color' => $this->faker->hexColor(),
            'text_color' => $this->faker->hexColor(),
            'description' => $this->faker->sentence(),
        ];
    }
}
