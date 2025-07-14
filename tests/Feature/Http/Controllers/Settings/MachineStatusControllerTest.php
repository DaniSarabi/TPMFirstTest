<?php

namespace Tests\Feature\Http\Controllers\Settings;

use App\Models\Machine;
use App\Models\MachineStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use App\Models\InspectionStatus;


class MachineStatusControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create the permission needed to access the settings
        Permission::firstOrCreate(['name' => 'machines.edit']);

        // Create a role and assign the permission
        $role = Role::firstOrCreate(['name' => 'test-admin']);
        $role->givePermissionTo('machines.edit');

        // Create a user and assign the role
        $user = User::factory()->create();
        $user->assignRole($role);

        // Act as this user for all tests in this file
        $this->actingAs($user);
    }

    public function test_can_view_machine_statuses_page(): void
    {
        $response = $this->get(route('settings.machine-status.index'));

        $response->assertOk();
        $response->assertInertia(fn($page) => $page->component('GeneralSettings/MachineStatus/Index'));
    }

    public function test_can_create_a_new_machine_status(): void
    {
        $statusData = [
            'name' => 'Awaiting Parts',
            'description' => 'Machine is waiting for replacement parts.',
            'bg_color' => '#fde68a',
            'text_color' => '#a16207',
        ];

        $response = $this->post(route('settings.machine-status.store'), $statusData);

        $response->assertRedirect()->with('success');
        $this->assertDatabaseHas('machine_statuses', ['name' => 'Awaiting Parts']);
    }

    public function test_can_update_a_machine_status(): void
    {
        $status = MachineStatus::factory()->create();

        $updatedData = [
            'name' => 'Updated Status Name',
            'description' => 'Updated description.',
            'bg_color' => '#ffffff',
            'text_color' => '#000000',
        ];

        $response = $this->put(route('settings.machine-status.update', $status), $updatedData);

        $response->assertRedirect()->with('success');
        $this->assertDatabaseHas('machine_statuses', [
            'id' => $status->id,
            'name' => 'Updated Status Name',
        ]);
    }

    public function test_can_delete_a_machine_status_and_reassign_machines(): void
    {
        // Create the default status first to ensure it has ID 1 ---
        MachineStatus::factory()->create(['id' => 1, 'name' => 'New']);

        // Now, create the other statuses. They will have IDs 2 and 3.
        $statusToDelete = MachineStatus::factory()->create();
        $newStatus = MachineStatus::factory()->create();

        // Create a machine with the status that will be deleted
        $machine = Machine::factory()->create(['machine_status_id' => $statusToDelete->id]);

        $response = $this->delete(route('settings.machine-status.destroy', $statusToDelete), [
            'new_status_id' => $newStatus->id,
        ]);

        $response->assertRedirect()->with('success');
        $this->assertDatabaseMissing('machine_statuses', ['id' => $statusToDelete->id]);
        // Assert that the machine's status was updated to the new status
        $this->assertDatabaseHas('machines', [
            'id' => $machine->id,
            'machine_status_id' => $newStatus->id,
        ]);
    }

    public function test_cannot_delete_the_default_machine_status(): void
    {
        // Create the default status with ID 1
        $defaultStatus = MachineStatus::factory()->create(['id' => 1, 'name' => 'New']);

        $response = $this->delete(route('settings.machine-status.destroy', $defaultStatus), [
            'new_status_id' => 2, // A dummy ID
        ]);

        $response->assertRedirect()->with('error');
        $this->assertDatabaseHas('machine_statuses', ['id' => 1]);
    }


    public function test_it_reassigns_inspection_statuses_when_a_machine_status_is_deleted(): void
    {
        // 1. Arrange
        $defaultStatus = MachineStatus::factory()->create(['name' => 'new']);
        $statusToDelete = MachineStatus::factory()->create(['name' => 'Needs Maintenance']);
        $newStatus = MachineStatus::factory()->create(['name' => 'Out of Service']);
        $inspectionStatus = InspectionStatus::factory()->create([
            'sets_machine_status_to' => $statusToDelete->name,
        ]);

        // 2. Act
        $this->delete(route('settings.machine-status.destroy', $statusToDelete), [
            'new_status_id' => $newStatus->id,
        ]);

        // 3. Assert
        // --- ACTION: Refresh the model from the database and assert directly ---
        $this->assertEquals($newStatus->name, $inspectionStatus->fresh()->sets_machine_status_to);
    }
}
