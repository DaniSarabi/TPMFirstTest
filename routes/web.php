<?php

use App\Http\Controllers\EmailContactController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\InspectionPointController;
use App\Http\Controllers\InspectionStatusController;
use App\Http\Controllers\MachineController;
use App\Http\Controllers\MachineStatusController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PartRequestController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SubsystemController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\TicketStatusController;
use App\Http\Controllers\TicketUpdateController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\TicketActionsController;

Route::get('/', function () {
    return Inertia::render('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // * ***************************** Notifications Routes *****************************
    // --- Rutas para el sistema de notificaciones en la aplicación ---
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-as-read');
    Route::post('/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-as-read');

    // * ***************************** Tickets module Routes *****************************

    Route::resource('tickets', TicketController::class)->except(['create', 'store', 'edit'])->middleware('permission:tickets.view');

    Route::patch('/tickets/{ticket}/start-work', [TicketActionsController::class, 'startWork'])->name('tickets.start-work');
    Route::patch('/tickets/{ticket}/resume-work', [TicketActionsController::class, 'resumeWork'])->name('tickets.resume-work');
    // --- ACTION: Add the new route for closing a ticket ---
    Route::patch('/tickets/{ticket}/close', [TicketActionsController::class, 'close'])->name('tickets.close');


    // This route will handle downloading the ticket PDF
    Route::get('/tickets/{ticket}/pdf', [TicketController::class, 'downloadPDF'])->name('tickets.pdf');

    // ------------------------------------ Ticket Update ------------------------------------

    // This route will handle posting new comments to a ticket
    Route::post('/tickets/{ticket}/updates', [TicketUpdateController::class, 'store'])->name('tickets.updates.store');
    // This route will handle the change of a ticket's status
    Route::patch('/tickets/{ticket}/status', [TicketUpdateController::class, 'updateStatus'])->name('tickets.status.update');

    // This route will handle sending the part request email
    Route::post('/tickets/{ticket}/request-parts', [PartRequestController::class, 'send'])->name('tickets.request-parts');

    // * ***************************** Inspections module Routes *****************************

    // This route will display the "Start Inspection" page
    Route::get('/inspections/start', [InspectionController::class, 'create'])->name('inspections.start')->middleware('permission:inspections.perform');

    // This route will create a new in-progress inspection report
    Route::post('/inspections', [InspectionController::class, 'store'])->name('inspections.store');

    // This route now accepts an InspectionReport model
    Route::get('/inspections/{inspectionReport}/perform', [InspectionController::class, 'perform'])->name('inspections.perform')->middleware('permission:inspections.perform');

    // This route will handle submitting the completed inspection
    Route::put('/inspections/{inspectionReport}', [InspectionController::class, 'update'])->name('inspections.update');

    Route::resource('inspections', InspectionController::class)
        ->only(['index'])
        ->middleware('permission:inspections.view');

    // This route will handle deleting/cancelling an inspection report.
    Route::delete('/inspections/{inspectionReport}', [InspectionController::class, 'destroy'])->name('inspections.destroy');
    // This route will display the details of a single inspection report
    Route::get('/inspections/{inspectionReport}', [InspectionController::class, 'show'])->name('inspections.show');

    Route::get('/inspections/{inspectionReport}/pdf', [InspectionController::class, 'downloadPDF'])
        ->name('inspections.pdf')
        ->middleware('permission:inspections.view');

    // This new route will handle the GET request from the QR code scan
    Route::get('/inspections/start-from-qr/{machine}', [InspectionController::class, 'startFromQr'])->name('inspections.startFromQr');

    // --- Add the new API-like route for getting open tickets ---
    Route::get('/inspection-points/{inspectionPoint}/open-tickets', [InspectionPointController::class, 'getOpenTickets'])
        ->name('inspection-points.open-tickets');

    // * ***************************** General Settings Routes *****************************

    //  Use a Route Group to correctly prefix the names and URLs ---
    // --- General Settings Route Group ---
    Route::prefix('general-settings')->name('settings.')->group(function () {

        Route::resource('machine-status', MachineStatusController::class)
            ->except(['show'])
            ->middleware('permission:machines.edit');

        Route::resource('inspection-status', InspectionStatusController::class)
            ->except(['show'])
            ->middleware('permission:inspections.edit');

        Route::resource('ticket-status', TicketStatusController::class)
            ->except(['show'])
            ->middleware('permission:tickets.edit');

        Route::resource('email-contacts', EmailContactController::class)
            ->except(['show'])
            ->middleware('permission:email-contacts.admin'); // Or a new settings permission
    });
    // * ***************************** Machines module Routes *****************************

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

    // Routes for adding a single inspection point (from the details page)
    Route::post('/inspection-points/add', [InspectionPointController::class, 'add'])->name('inspection-points.add');

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

    // ---//? *********************** QR Code Generation Routes *********************** ---

    Route::get('/machines/{machine}/qr-code', [MachineController::class, 'generateQrCode'])
        ->name('machines.qr-code');

    Route::get('/machines/{machine}/qr-code/pdf', [MachineController::class, 'downloadQrPdf'])
        ->name('machines.pdf.qr-code');

    Route::get('/machines/{machine}/qr-code/print', [MachineController::class, 'printQr'])
        ->name('machines.print.qr-code');
    // * ***************************** Users Routes *****************************
    Route::resource('users', UserController::class)
        ->only(['create', 'store'])
        ->middleware('permission:users.create');

    Route::resource('users', UserController::class)
        ->only(['edit', 'update'])
        ->middleware('permission:users.edit');

    Route::resource('users', UserController::class)
        ->only(['destroy'])
        ->middleware('permission:users.delete');

    Route::resource('users', UserController::class)
        ->only(['index', 'show'])
        ->middleware('permission:users.view|users.create|users.edit|users.delete');

    // * ***************************** Roles Routes *****************************
    Route::resource('roles', RoleController::class)
        ->only(['create', 'store'])
        ->middleware('permission:roles.create');

    Route::resource('roles', RoleController::class)
        ->only(['edit', 'update'])
        ->middleware('permission:roles.edit');

    Route::resource('roles', RoleController::class)
        ->only(['destroy'])
        ->middleware('permission:roles.delete');

    Route::resource('roles', RoleController::class)
        ->only(['index', 'show'])
        ->middleware('permission:roles.view|roles.create|roles.edit|roles.delete');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
