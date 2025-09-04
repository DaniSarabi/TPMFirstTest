<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\NotificationPreference;
use App\Models\Machine;
use Illuminate\Support\Facades\Auth;

class NotificationPreferencesController extends Controller
{
    /**
     * Display the notification preferences page.
     */
    public function edit()
    {
        $user = Auth::user();

        // Fetch all of the user's current preferences.
        $userPreferences = $user->notificationPreferences()->get();

        return Inertia::render('settings/notifications', [
            'allMachines' => Machine::orderBy('name')->get(['id', 'name']),
            // ACTION: Now loading from the dedicated config file for better organization.
            'allNotificationTypes' => config('notifications.types'),
            'userPreferences' => $userPreferences,
        ]);
    }

    /**
     * Update the user's notification preferences.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.*.notification_type' => 'required|string',
            'preferences.*.preferable_id' => 'nullable|integer',
            'preferences.*.preferable_type' => 'nullable|string',
        ]);

        $user = Auth::user();

        // First, clear all of the user's old preferences.
        $user->notificationPreferences()->delete();

        // Then, loop through the new preferences and create them.
        foreach ($validated['preferences'] as $pref) {
            NotificationPreference::create([
                'user_id' => $user->id,
                'notification_type' => $pref['notification_type'],
                'preferable_id' => $pref['preferable_id'],
                'preferable_type' => $pref['preferable_type'] ? ('App\\Models\\' . $pref['preferable_type']) : null,
            ]);
        }

        return back()->with('success', 'Notification preferences saved.');
    }
}
