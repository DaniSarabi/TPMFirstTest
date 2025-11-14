<?php

use App\Http\Controllers\Settings\NotificationPreferencesController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController; // Asegúrate de importar el nuevo controlador
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Settings\UserNotificationsController;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', 'settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('settings/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');

    // --- Rutas para las Preferencias de Notificación ---
    Route::get('/settings/notifications', [NotificationPreferencesController::class, 'edit'])->name('settings.notifications.edit');

    Route::patch('/settings/notifications', [NotificationPreferencesController::class, 'update'])->name('settings.notifications.update');

    Route::prefix('admin/notifications')->middleware('permission:notifications.admin')->name('admin.notifications.')->group(function () {

        Route::get('/', [UserNotificationsController::class, 'index'])
            ->name('manage.index');

        // 2. LA PÁGINA DE EDICIÓN (El formulario)
        Route::get('/users/{user}', [UserNotificationsController::class, 'edit'])
            ->name('manage.edit');

        // 3. LA LÓGICA DE GUARDADO (Esta se queda igual)
        Route::patch('/users/{user}', [UserNotificationsController::class, 'updateUserPreferences'])
            ->name('manage.update');
    });
});
