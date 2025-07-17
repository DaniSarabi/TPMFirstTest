<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\InspectionReport;
use App\Models\InspectionStatus;
use App\Models\Machine;
use App\Models\MachineStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use App\Models\Subsystem;
use App\Models\InspectionPoint;


class InspectionControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create all necessary permissions for the tests
        Permission::firstOrCreate(['name' => 'inspections.view']);
        Permission::firstOrCreate(['name' => 'inspections.perform']);
        Permission::firstOrCreate(['name' => 'inspections.administration']);

        // Create a standard operator role
        $operatorRole = Role::firstOrCreate(['name' => 'operator']);
        $operatorRole->givePermissionTo(['inspections.view', 'inspections.perform']);
        
        // Create an admin role
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        // Create a user and assign the operator role
        $user = User::factory()->create();
        $user->assignRole($operatorRole);

        $this->actingAs($user);
    }

    public function test_can_start_a_new_inspection(): void
    {
        $machine = Machine::factory()->create();

        $response = $this->post(route('inspections.store'), [
            'machine_id' => $machine->id,
        ]);

        $report = InspectionReport::first();
        $response->assertRedirect(route('inspections.perform', $report));
        $this->assertDatabaseHas('inspection_reports', [
            'machine_id' => $machine->id,
            'status' => 'in_progress',
        ]);
    }

   public function test_can_submit_a_completed_inspection(): void
    {
        // --- ACTION: Be more explicit in the test setup ---
        // 1. Arrange
        $machine = Machine::factory()->create();
        $subsystem = Subsystem::factory()->create(['machine_id' => $machine->id]);
        $point = InspectionPoint::factory()->create(['subsystem_id' => $subsystem->id]);
        
        $report = InspectionReport::factory()->create(['machine_id' => $machine->id]);
        $status = InspectionStatus::factory()->create();

        $results = [
            $point->id => ['status_id' => $status->id]
        ];

        // 2. Act
        $response = $this->put(route('inspections.update', $report), [
            'results' => $results,
        ]);

        // 3. Assert
        $response->assertRedirect(route('dashboard'));
        $this->assertDatabaseHas('inspection_report_items', [
            'inspection_report_id' => $report->id,
            'inspection_point_id' => $point->id,
            'inspection_status_id' => $status->id,
        ]);
        $this->assertDatabaseHas('inspection_reports', [
            'id' => $report->id,
            'status' => 'completed',
        ]);
    }

    public function test_can_cancel_an_in_progress_inspection(): void
    {
        $report = InspectionReport::factory()->create();

        $response = $this->delete(route('inspections.destroy', $report));

        $response->assertRedirect(route('inspections.start'));
        $this->assertDatabaseMissing('inspection_reports', ['id' => $report->id]);
    }

    public function test_an_administrator_can_view_all_inspection_reports(): void
    {
        // Create reports by different users
        InspectionReport::factory()->count(3)->create(['status' => 'completed']);
        InspectionReport::factory()->create(['user_id' => User::factory()->create(), 'status' => 'completed']);

        // Switch to an admin user
        $admin = User::factory()->create()->assignRole('admin');
        $this->actingAs($admin);

        $response = $this->get(route('inspections.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Inspections/Index')
            ->has('reports.data', 4) // Should see all 4 reports
        );
    }

    public function test_an_operator_can_only_view_their_own_reports(): void
    {
        // The user from setUp() has created these reports
        InspectionReport::factory()->count(2)->create([
            'user_id' => $this->app['auth']->user()->id,
            'status' => 'completed'
        ]);
        // A report from another user
        InspectionReport::factory()->create(['user_id' => User::factory()->create(), 'status' => 'completed']);

        $response = $this->get(route('inspections.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Inspections/Index')
            ->has('reports.data', 2) // Should only see their own 2 reports
        );
    }
}
