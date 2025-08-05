<?php

use App\Models\Machine;
use App\Models\MachineStatus;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

// --- GUEST TESTS ---

test('guests cannot view the machines index page', function () {
    // --- ACTION: Log out any existing user to ensure this test runs as a guest ---
    Auth::logout();

    $response = $this->get(route('machines.index'));

    // This assertion is more robust for test environments.
    $response->assertRedirect(route('login'));
});

// --- AUTHENTICATED USER TESTS ---

beforeEach(function () {
    // Use firstOrCreate to prevent errors on repeated test runs
    MachineStatus::firstOrCreate(['id' => 1], ['name' => 'New', 'bg_color' => '#dbeafe', 'text_color' => '#1e40af']);

    Permission::firstOrCreate(['name' => 'machines.view']);
    Permission::firstOrCreate(['name' => 'machines.create']);
    Permission::firstOrCreate(['name' => 'machines.delete']);

    $role = Role::firstOrCreate(['name' => 'test-role']);
    $role->givePermissionTo(['machines.view', 'machines.create', 'machines.delete']);

    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user);
});

test('authenticated users with permission can view the machines index page', function () {
    $response = $this->get(route('machines.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Machines/Index'));
});

test('a machine can be created successfully', function () {
    Storage::fake('public');

    $machineData = [
        'name' => 'New Test Machine',
        'description' => 'This is a test description.',
        'image' => UploadedFile::fake()->image('machine.jpg'),
    ];

    $response = $this->post(route('machines.store'), $machineData);

    $response->assertRedirect()->with('flash.machine');

    $this->assertDatabaseHas('machines', [
        'name' => 'New Test Machine',
        'machine_status_id' => 1,
    ]);

    $machine = Machine::firstWhere('name', 'New Test Machine');

    // ---  Get the raw image path from the model to bypass the accessor ---
    $imagePath = $machine->getRawOriginal('image_url');
    $this->assertTrue(Storage::disk('public')->exists($imagePath));
});

test('a machine can be deleted successfully', function () {
    // ---  Manually create the machine to ensure it has a valid status ---
    $machine = Machine::create([
        'name' => 'Machine to Delete',
        'description' => 'A test machine.',
        'machine_status_id' => 1,
        'created_by' => User::first()->id,
    ]);

    $response = $this->delete(route('machines.destroy', $machine));

    $response->assertRedirect(route('machines.index'))->with('success');

    $this->assertDatabaseMissing('machines', [
        'id' => $machine->id,
    ]);
});

test('a user without delete permission cannot delete a machine', function () {
    $userWithoutPermission = User::factory()->create();
    $this->actingAs($userWithoutPermission);

    $machine = Machine::create([
        'name' => 'Another Machine',
        'description' => 'A test machine.',
        'machine_status_id' => 1,
        'created_by' => User::first()->id,
    ]);

    $response = $this->delete(route('machines.destroy', $machine));

    $response->assertForbidden();
});
