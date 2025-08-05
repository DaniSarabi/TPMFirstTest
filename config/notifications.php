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
        'Tickets' => [
            'ticket.created' => 'When a new ticket is created.',
            'ticket.status.changed' => 'When a ticket\'s status is updated.',
            'ticket.comment.added' => 'When a new comment is added to a ticket.',
        ],
        'Inspections' => [
            'inspection.completed' => 'When an inspection is completed.',
        ],
        'Users & Roles' => [
            'user.created' => 'When a new user is added to the system.',
            'role.updated' => 'When a role\'s permissions are changed.',
        ],
        'Machines'=> [
            'machine.status.changed' => 'When a machine\'s status is updated.',
        ],
    ],
];
