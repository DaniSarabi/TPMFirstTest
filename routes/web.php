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
use App\Http\Controllers\Settings\MaintenanceTemplateController;
use App\Http\Controllers\MaintenanceCalendarController;
use App\Http\Controllers\ScheduledMaintenanceController;
use App\Http\Controllers\PerformMaintenanceController;
use App\Http\Controllers\MaintenancePhotoController;
use App\Http\Controllers\MaintenanceReportController;
use App\Http\Controllers\Settings\EscalationPolicyController;
use App\Http\Controllers\Settings\EscalationLevelController;
use App\Http\Controllers\Settings\NotificationPreferencesController; // <-- Make sure this line exists!


Route::get('/', function () {
    return Inertia::render('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // * ***************************** Maintenance Calendar Routes *****************************

    // Maintenance Calendar Route
    Route::get('/maintenance-calendar', [MaintenanceCalendarController::class, 'index'])
        ->name('maintenance-calendar.index')
        ->middleware('permission:preventive-maintenance.view');

    // Routes for creating, updating, and deleting scheduled events
    Route::resource('scheduled-maintenances', ScheduledMaintenanceController::class)
        ->only(['store', 'update', 'destroy'])
        ->middleware('permission:preventive-maintenance.schedule');

    // ---//? *********************** Perform Maintenance Routes *********************** ---

    // Routes for the "Perform Maintenance" workflow
    Route::get('/perform-maintenance/{scheduledMaintenance}', [PerformMaintenanceController::class, 'show'])
        ->name('maintenance.perform.show')
        ->middleware('permission:preventive-maintenance.perform');

    Route::post('/perform-maintenance/{scheduledMaintenance}/start', [PerformMaintenanceController::class, 'start'])
        ->name('maintenance.perform.start')
        ->middleware('permission:preventive-maintenance.perform');


    // Routes for saving progress and submitting the final report
    Route::post('/perform-maintenance/{scheduledMaintenance}/save', [PerformMaintenanceController::class, 'saveProgress'])
        ->name('maintenance.perform.save')
        ->middleware('permission:preventive-maintenance.perform');

    Route::post('/perform-maintenance/{scheduledMaintenance}/submit', [PerformMaintenanceController::class, 'submitReport'])
        ->name('maintenance.perform.submit')
        ->middleware('permission:preventive-maintenance.perform');

    // Route for deleting a single maintenance photo
    Route::delete('/maintenance-photos/{maintenancePhoto}', [MaintenancePhotoController::class, 'destroy'])
        ->name('maintenance-photos.destroy')
        ->middleware('permission:preventive-maintenance.perform');

    //  ? * ***************************** Maintenance Report Routes *****************************
    // Route for viewing a single maintenance report
    Route::get('/maintenance-reports/{maintenanceReport}', [MaintenanceReportController::class, 'show'])
        ->name('maintenance-reports.show')
        ->middleware('permission:preventive-maintenance.view');

    // Route for downloading the PDF of a report
    Route::get('/maintenance-reports/{maintenanceReport}/pdf', [MaintenanceReportController::class, 'downloadPDF'])
        ->name('maintenance-reports.pdf')
        ->middleware('permission:preventive-maintenance.view');

    // * ***************************** Notifications Routes *****************************
    // --- Rutas para el sistema de notificaciones en la aplicación ---
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-as-read');
    Route::post('/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-as-read');


    // * ***************************** Tickets module Routes *****************************


    Route::resource('tickets', TicketController::class)->except(['create', 'store', 'edit'])->middleware('permission:tickets.view');

    Route::patch('/tickets/{ticket}/start-work', [TicketActionsController::class, 'startWork'])->name('tickets.start-work')->middleware('permission:tickets.perform');
    Route::patch('/tickets/{ticket}/resume-work', [TicketActionsController::class, 'resumeWork'])->name('tickets.resume-work')->middleware('permission:tickets.perform');
    Route::patch('/tickets/{ticket}/close', [TicketActionsController::class, 'close'])->name('tickets.close')->middleware('permission:tickets.close');
    Route::patch('/tickets/{ticket}/escalate', [TicketActionsController::class, 'escalate'])->name('tickets.escalate')->middleware('permission:tickets.escalate');
    Route::patch('/tickets/{ticket}/downgrade', [TicketActionsController::class, 'downgrade'])->name('tickets.downgrade')->middleware('permission:tickets.discard');
    Route::patch('/tickets/{ticket}/discard', [TicketActionsController::class, 'discard'])->name('tickets.discard')->middleware('permission:tickets.discard');


    // This route will handle downloading the ticket PDF
    Route::get('/tickets/{ticket}/pdf', [TicketController::class, 'downloadPDF'])->name('tickets.pdf')->middleware('permission:tickets.view');

    // ? ------------------------------------ Ticket Update ------------------------------------

    // These actions are performed by a user working on a ticket
    Route::post('/tickets/{ticket}/updates', [TicketUpdateController::class, 'store'])->name('tickets.updates.store')->middleware('permission:tickets.perform');
    Route::patch('/tickets/{ticket}/status', [TicketUpdateController::class, 'updateStatus'])->name('tickets.status.update')->middleware('permission:tickets.perform');
    Route::post('/tickets/{ticket}/request-parts', [PartRequestController::class, 'send'])->name('tickets.request-parts')->middleware('permission:tickets.perform');

    // * ***************************** Inspections module Routes *****************************

    // This route will display the "Start Inspection" page
    Route::get('/inspections/start', [InspectionController::class, 'create'])->name('inspections.start')->middleware('permission:inspections.perform');

    // This route will create a new in-progress inspection report
    Route::post('/inspections', [InspectionController::class, 'store'])->name('inspections.store')->middleware('permission:inspections.perform');

    // This route now accepts an InspectionReport model
    Route::get('/inspections/{inspectionReport}/perform', [InspectionController::class, 'perform'])->name('inspections.perform')->middleware('permission:inspections.perform');

    // This route will handle submitting the completed inspection
    Route::put('/inspections/{inspectionReport}', [InspectionController::class, 'update'])->name('inspections.update')->middleware('permission:inspections.perform');

    Route::resource('inspections', InspectionController::class)
        ->only(['index'])
        ->middleware('permission:inspections.view');

    // This route will handle deleting/cancelling an inspection report.
    Route::delete('/inspections/{inspectionReport}', [InspectionController::class, 'destroy'])->name('inspections.destroy')->middleware('permission:inspections.administration');

    // This route will display the details of a single inspection report
    Route::get('/inspections/{inspectionReport}', [InspectionController::class, 'show'])->name('inspections.show')->middleware('permission:inspections.view');

    Route::get('/inspections/{inspectionReport}/pdf', [InspectionController::class, 'downloadPDF'])
        ->name('inspections.pdf')
        ->middleware('permission:inspections.view');

    // This new route will handle the GET request from the QR code scan
    Route::get('/inspections/start-from-qr/{machine}', [InspectionController::class, 'startFromQr'])->name('inspections.startFromQr')->middleware('permission:inspections.perform');

    // --- Add the new API-like route for getting open tickets ---
    Route::get('/inspection-points/{inspectionPoint}/open-tickets', [InspectionPointController::class, 'getOpenTickets'])
        ->name('inspection-points.open-tickets')->middleware('permission:inspections.view');


    // * ***************************** General Settings Routes *****************************

    // ? --- General Settings Route Group ---
    Route::prefix('general-settings')->name('settings.')->group(function () {

        Route::resource('machine-status', MachineStatusController::class)
            ->except(['show'])
            ->middleware('permission:machines.edit');

        Route::resource('inspection-status', InspectionStatusController::class)
            ->except(['show'])
            ->middleware('permission:inspections.administration');

        Route::resource('ticket-status', TicketStatusController::class)
            ->except(['show'])
            ->middleware('permission:tickets.discard');

        Route::resource('email-contacts', EmailContactController::class)
            ->except(['show'])
            ->middleware('permission:email-contacts.admin'); // Or a new settings permission

        Route::resource('maintenance-templates', MaintenanceTemplateController::class)
            ->except(['show'])
            ->middleware('permission:maintenance-templates.view'); // Or a new 'edit' permission

        Route::put('maintenance-templates/{maintenanceTemplate}/sync-tasks', [MaintenanceTemplateController::class, 'syncTasks'])
            ->name('maintenance-templates.sync-tasks')
            ->middleware('permission:maintenance-templates.edit'); // Or a new 'edit' permission

        Route::resource('escalation-policies', EscalationPolicyController::class)
            ->except(['show'])
            ->middleware('permission:policies.edit');

        Route::patch('escalation-policies/{escalationPolicy}/toggle-status', [EscalationPolicyController::class, 'toggleStatus'])
            ->name('escalation-policies.toggle-status')
            ->middleware('permission:policies.edit');

        Route::resource('escalation-levels', EscalationLevelController::class)
            ->only(['store', 'update', 'destroy'])
            ->middleware('permission:policies.edit');

        Route::post('escalation-levels/{escalationLevel}/sync-contacts', [EscalationLevelController::class, 'syncContacts'])
            ->name('escalation-levels.sync-contacts')
            ->middleware('permission:policies.edit');
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

    // Route for downloading the maintenance schedule EXCEL
    Route::get('/machines/{machine}/maintenance-plan/download', [MachineController::class, 'downloadMaintenancePlan'])
        ->name('machines.maintenance-plan.download')
        ->middleware('permission:preventive-maintenance.view');

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
