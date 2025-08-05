<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Machine;
use App\Models\Subsystem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SubsystemControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create the necessary permissions
        Permission::firstOrCreate(['name' => 'machines.create']);
        Permission::firstOrCreate(['name' => 'machines.edit']);
        Permission::firstOrCreate(['name' => 'machines.delete']);

        // Create a role and assign the permissions
        $role = Role::firstOrCreate(['name' => 'test-role']);
        $role->givePermissionTo(['machines.create', 'machines.edit', 'machines.delete']);

        // Create a user and assign the role
        $user = User::factory()->create();
        $user->assignRole($role);

        // Act as this user for all tests in this file
        $this->actingAs($user);
    }

    public function test_a_single_subsystem_can_be_added_to_a_machine(): void
    {
        $machine = Machine::factory()->create();

        $response = $this->post(route('subsystems.add', $machine), [
            'name' => 'New Hydraulic System',
        ]);

        $response->assertStatus(200); // Check for a successful JSON response
        $this->assertDatabaseHas('subsystems', [
            'machine_id' => $machine->id,
            'name' => 'New Hydraulic System',
        ]);
    }

    public function test_a_subsystem_can_be_updated(): void
    {
        $subsystem = Subsystem::factory()->create();

        $response = $this->put(route('subsystems.update', $subsystem), [
            'name' => 'Updated Subsystem Name',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('subsystems', [
            'id' => $subsystem->id,
            'name' => 'Updated Subsystem Name',
        ]);
    }

    public function test_a_subsystem_can_be_deleted(): void
    {
        $subsystem = Subsystem::factory()->create();

        $response = $this->delete(route('subsystems.destroy', $subsystem));

        $response->assertRedirect()->with('success');
        $this->assertDatabaseMissing('subsystems', [
            'id' => $subsystem->id,
        ]);
    }
}
