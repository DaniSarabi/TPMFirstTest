<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class UserNotificationsController extends Controller
{
    /**
     * Muestra la página principal de gestión de notificaciones.
     */
    public function index(): Response
    {
        return Inertia::render('settings/manageNotifications', [
            // Pasamos los 3 catálogos que el frontend necesita para construir la UI
            'allUsers' => User::orderBy('name')->get(['id', 'name']),
            'allNotificationTypes' => config('notifications.types'),
            'allMachines' => Machine::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * API: Obtiene las preferencias de un usuario específico.
     */
    public function getUserPreferences(User $user)
    {
        // Solo devolvemos los datos crudos de las preferencias
        return response()->json([
            'preferences' => $user->notificationPreferences->map(fn($p) => [
                'notification_type' => $p->notification_type,
                'preferable_id' => $p->preferable_id,
                'preferable_type' => $p->preferable_type ? class_basename($p->preferable_type) : null,
            ])
        ]);
    }

    /**
     * API: Actualiza las preferencias de un usuario específico.
     * (Esta lógica es idéntica a la de NotificationPreferencesController)
     */
    public function updateUserPreferences(Request $request, User $user)
    {
        $validated = $request->validate([
            'preferences' => 'present|array',
            'preferences.*.notification_type' => 'required|string',
            'preferences.*.preferable_id' => 'nullable|integer',
            'preferences.*.preferable_type' => 'nullable|string|in:Machine',
        ]);

        $preferencesData = collect($validated['preferences'])->map(function ($pref) use ($user) {
            return [
                'user_id' => $user->id,
                'notification_type' => $pref['notification_type'],
                'preferable_id' => $pref['preferable_id'],
                'preferable_type' => $pref['preferable_type'] ? 'App\\Models\\' . $pref['preferable_type'] : null,
            ];
        });

        DB::transaction(function () use ($user, $preferencesData) {
            // 1. Borramos todas las preferencias viejas de ESE usuario
            $user->notificationPreferences()->delete();

            // 2. Insertamos las nuevas
            DB::table('notification_preferences')->insert($preferencesData->all());
        });

        return redirect()->back()->with('success', "Preferences for {$user->name} updated successfully!");
    }
}
