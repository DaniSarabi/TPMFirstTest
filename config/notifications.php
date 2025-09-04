<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Notification Types
    |--------------------------------------------------------------------------
    |
    | This file defines all the available in-app notification types.
    | The key is the machine-readable name, and the value is a user-friendly description.
    | They are grouped by category for display in the UI.
    |
    */


    'types' => [
        'Global' => [
            'user.created' => 'A new user is added to the system',
            'role.updated' => 'A user role is updated',
        ],
        'Tickets' => [
            'ticket.created' => 'A new ticket is created',
            'ticket.status.changed' => 'A ticket\'s status changes',
            'ticket.comment.added' => 'A new comment is added to a ticket',
        ],
        'Inspections' => [
            'inspection.completed' => 'An inspection is completed',
        ],
        'Maintenance' => [
            'maintenance.reminder' => 'A scheduled maintenance is approaching',
            'maintenance.overdue' => 'A scheduled maintenance becomes overdue',
        ],
    ],
];
