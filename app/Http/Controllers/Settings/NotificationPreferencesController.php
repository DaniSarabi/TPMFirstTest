<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\NotificationPreference;
use App\Models\Machine;
use Illuminate\Support\Facades\Auth;
use App\Models\LockedNotification;
use Inertia\Response;

class NotificationPreferencesController extends Controller
{
    /**
     * Display the notification preferences page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('settings/notifications', [
            'allMachines' => Machine::orderBy('name')->get(['id', 'name']),
            'allNotificationTypes' => config('notifications.types'),
            'userPreferences' => $user->notificationPreferences->map(fn($p) => [
                'notification_type' => $p->notification_type,
                'preferable_id' => $p->preferable_id,
                'preferable_type' => $p->preferable_type ? class_basename($p->preferable_type) : null,
            ]),
            // 2. Le mandamos al frontend la lista de "candados"
            'lockedPreferences' => $user->lockedPreferences->pluck('notification_type'),
        ]);
    }


    /**
     * Update the user's notification preferences.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'preferences' => 'present|array',
            'preferences.*.notification_type' => 'required|string',
            'preferences.*.preferable_id' => 'nullable|integer',
            'preferences.*.preferable_type' => 'nullable|string|in:Machine',
        ]);

        $user = Auth::user();

        // 3. Obtenemos la lista de preferencias "bloqueadas"
        $lockedTypes = $user->lockedPreferences->pluck('notification_type');

        // 4. Preparamos los nuevos datos que SÍ podemos guardar
        $preferencesToInsert = collect($validated['preferences'])
            // Filtramos cualquier intento de guardar una preferencia bloqueada
            ->whereNotIn('notification_type', $lockedTypes)
            ->map(function ($pref) use ($user) {
                return [
                    'user_id' => $user->id,
                    'notification_type' => $pref['notification_type'],
                    'preferable_id' => $pref['preferable_id'],
                    'preferable_type' => $pref['preferable_type'] ? 'App\\Models\\' . $pref['preferable_type'] : null,
                ];
            });

        DB::transaction(function () use ($user, $preferencesToInsert, $lockedTypes) {
            // 1. Borramos todas las preferencias viejas que NO estén bloqueadas
            $user->notificationPreferences()
                ->whereNotIn('notification_type', $lockedTypes)
                ->delete();

            // 2. Insertamos las nuevas
            // (Si el frontend nos manda 19 filas, insertamos 19. Si nos manda 1 (null), insertamos 1)
            NotificationPreference::insert($preferencesToInsert->all());
        });

        return redirect()->back()->with('success', 'Preferences saved successfully!');
    }
}
