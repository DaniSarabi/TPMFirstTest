<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Fetch the user's latest notifications.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Fetch the 10 latest notifications for the user
        $notifications = $user->notifications()->latest()->take(15)->get();

        // We can also get a count of unread notifications
        $unreadCount = $user->unreadNotifications()->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|string',
        ]);

        $notification = $request->user()->notifications()->find($validated['id']);

        if ($notification) {
            $notification->markAsRead();
        }

        return response()->noContent();
    }

    /**
     * Mark all of the user's unread notifications as read.
     */
    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->noContent();
    }
}
