<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class NotificationPreferencesController extends Controller
{
    /**
     * Show the form for editing the user's notification preferences.
     */
    public function edit(Request $request)
    {
        // We will define all possible notification types in a config file
        // to keep them organized and consistent across the application.
        $allNotificationTypes = config('notifications.types');

        // Fetch the user's currently saved preferences.
        $userPreferences = DB::table('notification_preferences')
            ->where('user_id', $request->user()->id)
            ->pluck('notification_type')
            ->all();

        return Inertia::render('settings/notifications', [
            'allNotificationTypes' => $allNotificationTypes,
            'userPreferences' => $userPreferences,
        ]);
    }

    /**
     * Update the user's notification preferences in storage.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.*' => 'string', // Ensure all items in the array are strings
        ]);

        $user = $request->user();

        // A simple and robust way to update is to delete the old preferences
        // and insert the new ones.
        DB::table('notification_preferences')->where('user_id', $user->id)->delete();

        $newPreferences = collect($validated['preferences'])->map(function ($type) use ($user) {
            return [
                'user_id' => $user->id,
                'notification_type' => $type,
            ];
        });

        DB::table('notification_preferences')->insert($newPreferences->all());

        return back()->with('success', 'Notification preferences updated.');
    }
}
