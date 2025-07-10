<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\MachineController;
use App\Http\Controllers\SubsystemController;
use App\Http\Controllers\InspectionPointController;
use App\Http\Controllers\MachineStatusController;



Route::get('/', function () {
    return Inertia::render('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');


     // --- ACTION 2: Use a Route Group to correctly prefix the names and URLs ---
    Route::prefix('general-settings')->name('settings.')->group(function () {
        Route::resource('machine-status', MachineStatusController::class)
            ->except(['show'])
            ->middleware('permission:machines.edit'); // Protect the routes
    });
    //* ***************************** Machines module Routes *****************************

    // Routes for viewing machines (list and details)
    Route::resource('machines', MachineController::class)
        ->only(['index', 'show'])
        ->middleware('permission:machines.view');

    // Routes for creating a new machine and its components
    Route::resource('machines', MachineController::class)
        ->only(['store'])
        ->middleware('permission:machines.create');

    Route::post('/machines/{machine}/subsystems', [SubsystemController::class, 'store'])->name('subsystems.store')->middleware('permission:machines.create');
    Route::post('/inspection-points', [InspectionPointController::class, 'store'])->name('inspection-points.store')->middleware('permission:machines.create');

    // Routes for adding a single subsystem (from the details page)
    Route::post('/machines/{machine}/subsystems/add', [SubsystemController::class, 'add'])->name('subsystems.add')->middleware('permission:machines.create');

    // Routes for editing/updating a machine and its components
    Route::resource('machines', MachineController::class)
        ->only(['update'])
        ->middleware('permission:machines.edit');

    Route::put('/subsystems/{subsystem}', [SubsystemController::class, 'update'])->name('subsystems.update')->middleware('permission:machines.edit');
    Route::put('/subsystems/{subsystem}/update-from-page', [SubsystemController::class, 'updateFromPage'])->name('subsystems.updateFromPage')->middleware('permission:machines.edit');
    Route::put('/inspection-points/{inspectionPoint}', [InspectionPointController::class, 'update'])->name('inspection-points.update')->middleware('permission:machines.edit');

    // Routes for deleting a machine and its components
    Route::resource('machines', MachineController::class)
        ->only(['destroy'])
        ->middleware('permission:machines.delete');

    Route::delete('/subsystems/{subsystem}', [SubsystemController::class, 'destroy'])->name('subsystems.destroy')->middleware('permission:machines.delete');
    Route::delete('/inspection-points/{inspectionPoint}', [InspectionPointController::class, 'destroy'])->name('inspection-points.destroy')->middleware('permission:machines.delete');


    //Route::post('/machines', [MachineController::class, 'store'])->name('machines.store_api');

    //* ***************************** Users Routes *****************************
    Route::resource("users", UserController::class)
        ->only(["create", "store"])
        ->middleware("permission:users.create");

    Route::resource("users", UserController::class)
        ->only(["edit", "update"])
        ->middleware("permission:users.edit");

    Route::resource("users", UserController::class)
        ->only(["destroy"])
        ->middleware("permission:users.delete");

    Route::resource("users", UserController::class)
        ->only(["index", "show"])
        ->middleware("permission:users.view|users.create|users.edit|users.delete");

    //* ***************************** Roles Routes *****************************
    Route::resource("roles", RoleController::class)
        ->only(["create", "store"])
        ->middleware("permission:roles.create");

    Route::resource("roles", RoleController::class)
        ->only(["edit", "update"])
        ->middleware("permission:roles.edit");

    Route::resource("roles", RoleController::class)
        ->only(["destroy"])
        ->middleware("permission:roles.delete");

    Route::resource("roles", RoleController::class)
        ->only(["index", "show"])
        ->middleware("permission:roles.view|roles.create|roles.edit|roles.delete");
});


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
