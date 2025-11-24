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
            // Evento: Se crea un nuevo ticket
            'ticket.created.in_app' => 'In-App: When a new ticket is created.',
            'ticket.created.email'  => 'Email: When a new ticket is created.',
            'ticket.created.teams'  => 'Teams: Post when a new ticket is created.',

            'ticket.closed.in_app' => 'In-App: When a ticket is marked as resolved.',
            'ticket.closed.email'  => 'Email: When a ticket is marked as resolved.',
            'ticket.closed.teams'  => 'Teams: Notify when a ticket is marked as resolved.',

            // Discarded
            'ticket.discarded.in_app' => 'In-App: When a ticket is discarded (canceled).',
            'ticket.discarded.email'  => 'Email: When a ticket is discarded (canceled).',
            'ticket.discarded.teams'  => 'Teams: Notify when a ticket is discarded.',

            // Awaiting parts
            'ticket.awaiting_parts.in_app' => 'In-App: When a ticket is paused on a on hold status.',
            'ticket.awaiting_parts.email'  => 'Email: When a ticket is paused on a on hold status.',
            'ticket.awaiting_parts.teams'  => 'Teams: Notify when a ticket enters on a on hold status.',

            // Escalated
            'ticket.escalated.in_app' => 'In-App: When a ticket is escalated to Critical priority.',
            'ticket.escalated.email'  => 'Email: When a ticket is escalated to Critical priority.',
            'ticket.escalated.teams'  => 'Teams: Post when a ticket is escalated to Critical.',

            // Downgraded (already correct)
            'ticket.downgraded.in_app' => 'In-App: When a ticket priority is downgraded.',
            'ticket.downgraded.email'  => 'Email: When a ticket priority is downgraded.',
            'ticket.downgraded.teams'  => 'Teams: Notify when a ticket priority is downgraded.',
        ],

        'Inspections' => [
            // Evento: Se completa una inspección (¡Sin fallas!)
            'inspection.completed.in_app' => 'In-App: When an inspection is completed with no issues.',
            'inspection.completed.email'  => 'Email: When an inspection is completed with no issues.',
            'inspection.completed.teams'  => 'Teams: Notify when an inspection is completed with no issues.',

            // Inspection completed with failures
            'inspection.failed.in_app' => 'In-App: When an inspection is completed with reported failures.',
            'inspection.failed.email'  => 'Email: When an inspection is completed with reported failures.',
            'inspection.failed.teams'  => 'Teams: Post in a channel when an inspection reports failures.',
        ],

        'Maintenance' => [
            // Evento: Recordatorio de mantenimiento
            'maintenance.reminder.in_app' => 'In-App: Reminder of a scheduled maintenance.',
            'maintenance.reminder.email'  => 'Email: Reminder of a scheduled maintenance.',
            'maintenance.reminder.teams'  => 'Teams: Post a reminder for critical maintenance.',

            // Maintenance overdue
            'maintenance.overdue.in_app' => 'In-App: When a scheduled maintenance becomes overdue.',
            'maintenance.overdue.email'  => 'Email: When a scheduled maintenance becomes overdue.',
            'maintenance.overdue.teams'  => 'Teams: Post in a channel when maintenance becomes overdue.',
        ],
        'AI & Coaching' => [
            'technician.coaching.in_app' => 'In-App: Receive feedback about the documentation about the tickets I close.',
            'technician.coaching.email'  => 'Email: Receive feedback about the documentation about the tickets I close.',
            'technician.coaching.teams'  => 'Teams: Receive feedback about the documentation about the tickets I close.',
        ],
    ],
];
