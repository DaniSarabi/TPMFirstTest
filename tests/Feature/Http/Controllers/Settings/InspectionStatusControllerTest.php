<?php

namespace Tests\Feature\Http\Controllers\Settings;

use App\Models\InspectionStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use App\Models\MachineStatus;



class InspectionStatusControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create the permission needed to access the settings
        Permission::firstOrCreate(['name' => 'inspections.edit']);

        // Create a role and assign the permission
        $role = Role::firstOrCreate(['name' => 'test-admin']);
        $role->givePermissionTo('inspections.edit');

        // Create a user and assign the role
        $user = User::factory()->create();
        $user->assignRole($role);

        // Act as this user for all tests in this file
        $this->actingAs($user);
    }

    public function test_can_view_inspection_statuses_page(): void
    {
        $response = $this->get(route('settings.inspection-status.index'));

        $response->assertOk();
        $response->assertInertia(fn($page) => $page->component('GeneralSettings/InspectionStatus/Index'));
    }

    public function test_can_create_a_new_inspection_status(): void
    {
        $statusData = [
            'name' => 'Needs Cleaning',
            'severity' => 1,
            'auto_creates_ticket' => true,
            'sets_machine_status_to' => null,
            'bg_color' => '#fde68a',
            'text_color' => '#a16207',
            'is_default' => false,
        ];

        // ---  Use the correct, prefixed route name ---
        $response = $this->post(route('settings.inspection-status.store'), $statusData);

        $response->assertRedirect()->with('success');
        $this->assertDatabaseHas('inspection_statuses', ['name' => 'Needs Cleaning']);
    }

    public function test_can_update_an_inspection_status(): void
    {
        $statusnew = InspectionStatus::factory()->create();
        $status = InspectionStatus::factory()->create();

        $newMachineStatus = MachineStatus::factory()->create();

        $updatedData = [
            'name' => 'Updated Status Name',
            'severity' => 2,
            'auto_creates_ticket' => false,
            'machine_status_id' => $newMachineStatus->id,
            'bg_color' => '#ffffff',
            'text_color' => '#000000',
            'is_default' => false,
        ];

        $response = $this->put(route('settings.inspection-status.update', $status), $updatedData);

        $response->assertRedirect()->with('success');
        $this->assertDatabaseHas('inspection_statuses', [
            'id' => $status->id,
            'name' => 'Updated Status Name',
            'machine_status_id' => $newMachineStatus->id,
        ]);
    }

    public function test_can_delete_an_inspection_status(): void
    {
        // --- ACTION: Update the delete test to send the new_status_id ---
        $statusToDelete = InspectionStatus::factory()->create();
        $newStatus = InspectionStatus::factory()->create();

        $response = $this->delete(route('settings.inspection-status.destroy', $statusToDelete), [
            'new_status_id' => $newStatus->id,
        ]);

        $response->assertRedirect()->with('success');
        $this->assertDatabaseMissing('inspection_statuses', ['id' => $statusToDelete->id]);
    }

    public function test_cannot_delete_the_default_inspection_status(): void
    {
        // Create a status and mark it as the default
        $defaultStatus = InspectionStatus::factory()->create(['is_default' => true]);
        $otherStatus = InspectionStatus::factory()->create();

        // --- ACTION: Update the delete test to send the new_status_id ---
        $response = $this->delete(route('settings.inspection-status.destroy', $defaultStatus), [
            'new_status_id' => $otherStatus->id,
        ]);

        $response->assertRedirect()->with('error');
        $this->assertDatabaseHas('inspection_statuses', ['id' => $defaultStatus->id]);
    }
}
