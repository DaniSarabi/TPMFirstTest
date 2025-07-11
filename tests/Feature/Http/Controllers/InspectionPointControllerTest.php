<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\InspectionPoint;
use App\Models\Subsystem;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class InspectionPointControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Permission::firstOrCreate(['name' => 'machines.edit']);

        $role = Role::firstOrCreate(['name' => 'test-role']);
        $role->givePermissionTo('machines.edit');

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->actingAs($user);
    }

    public function test_an_inspection_point_can_be_added_to_a_subsystem(): void
    {
        $subsystem = Subsystem::factory()->create();

        $response = $this->post(route('inspection-points.add', $subsystem), [
            'name' => 'New Test Point',
        ]);

        $response->assertRedirect()->with('flash.newPoint');
        $this->assertDatabaseHas('inspection_points', [
            'subsystem_id' => $subsystem->id,
            'name' => 'New Test Point',
        ]);
    }

    public function test_an_inspection_point_can_be_updated(): void
    {
        $point = InspectionPoint::factory()->create();

        $response = $this->put(route('inspection-points.update', $point), [
            'name' => 'Updated Point Name',
        ]);

        $response->assertRedirect()->with('success');
        $this->assertDatabaseHas('inspection_points', [
            'id' => $point->id,
            'name' => 'Updated Point Name',
        ]);
    }

    public function test_an_inspection_point_can_be_deleted(): void
    {
        $point = InspectionPoint::factory()->create();

        $response = $this->delete(route('inspection-points.destroy', $point));

        $response->assertRedirect()->with('success');
        $this->assertDatabaseMissing('inspection_points', [
            'id' => $point->id,
        ]);
    }
}
