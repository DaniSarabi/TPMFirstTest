<?php

namespace Database\Factories;

use App\Models\InspectionPoint;
use App\Models\InspectionReport;
use App\Models\InspectionStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InspectionReportItem>
 */
class InspectionReportItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'inspection_report_id' => InspectionReport::factory(),
            'inspection_point_id' => InspectionPoint::factory(),
            'inspection_status_id' => InspectionStatus::factory(),
            'comment' => $this->faker->sentence(),
            'image_url' => null,
        ];
    }
}
