<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use App\Models\LockedNotification;
use App\Models\NotificationPreference;

class UserNotificationsController extends Controller
{
    /**
     * Muestra el "Dashboard" de admin con la TABLA de usuarios.
     */
    public function index(): Response
    {
        $users = User::withCount(['notificationPreferences', 'lockedPreferences'])
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('settings/Admin/Index', [ // <-- ¡Nueva Página!
            'users' => $users,
        ]);
    }

    /**
     * Muestra la página de EDICIÓN para un solo usuario.
     */
    public function edit(User $user): Response
    {
        // (Esta es la lógica que teníamos en el 'index' anterior)
        return Inertia::render('settings/Admin/Edit', [ // <-- ¡Nueva Página!
            'userToManage' => $user->only('id', 'name'),
            'allNotificationTypes' => config('notifications.types'),
            'allMachines' => Machine::orderBy('name')->get(['id', 'name']),
            'userPreferences' => $user->notificationPreferences->map(fn($p) => [
                'notification_type' => $p->notification_type,
                'preferable_id' => $p->preferable_id,
                'preferable_type' => $p->preferable_type ? class_basename($p->preferable_type) : null,
            ]),
            'lockedPreferences' => $user->lockedPreferences->pluck('notification_type'),
        ]);
    }

    /**
     * API: Obtiene las preferencias de un usuario específico.
     */
    public function getUserPreferences(User $user)
    {
        return response()->json([
            'preferences' => $user->notificationPreferences->map(fn($p) => [
                'notification_type' => $p->notification_type,
                'preferable_id' => $p->preferable_id,
                'preferable_type' => $p->preferable_type ? class_basename($p->preferable_type) : null,
            ]),
            // 2. Le mandamos al frontend la lista de "candados" de ESE usuario
            'lockedPreferences' => $user->lockedPreferences->pluck('notification_type'),
        ]);
    }
    /**
     * API: Actualiza las preferencias de un usuario específico.
     * (Esta lógica es idéntica a la de NotificationPreferencesController)
     */
    public function updateUserPreferences(Request $request, User $user)
    {
        $validated = $request->validate([
            // La lista de 'toggles' (globales y por-máquina)
            'preferences' => 'present|array',
            'preferences.*.notification_type' => 'required|string',
            'preferences.*.preferable_id' => 'nullable|integer',
            'preferences.*.preferable_type' => 'nullable|string|in:Machine',

            'lockedPreferences' => 'present|array',
            'lockedPreferences.*' => 'required|string',
        ]);

        $preferencesData = collect($validated['preferences'])->map(function ($pref) use ($user) {
            return [
                'user_id' => $user->id,
                'notification_type' => $pref['notification_type'],
                'preferable_id' => $pref['preferable_id'],
                'preferable_type' => $pref['preferable_type'] ? 'App\\Models\\' . $pref['preferable_type'] : null,
            ];
        });

        $lockedData = collect($validated['lockedPreferences'])->map(function ($type) use ($user) {
            return [
                'user_id' => $user->id,
                'notification_type' => $type,
            ];
        });

        DB::transaction(function () use ($user, $preferencesData, $lockedData) {
            // 1. Borramos TODO lo viejo de ESE usuario
            $user->notificationPreferences()->delete();
            $user->lockedPreferences()->delete();

            // 2. Insertamos lo nuevo
            NotificationPreference::insert($preferencesData->all());
            LockedNotification::insert($lockedData->all());
        });

        return redirect()->route('admin.notifications.manage.edit', $user->id)
            ->with('success', "Preferences for {$user->name} updated!");
    }
}
