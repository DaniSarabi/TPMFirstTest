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
            'ticket.created.in_app' => 'In-App: When a new Ticket gets created.',
            'ticket.created.email'  => 'Email: Cuando se crea un nuevo ticket.',
            'ticket.created.teams'  => 'Teams: Postear cuando se crea un nuevo ticket.',

            // Evento: Un ticket es cerrado
            'ticket.closed.in_app' => 'In-App: Cuando un ticket se marca como resuelto.',
            'ticket.closed.email'  => 'Email: Cuando un ticket se marca como resuelto.',
            'ticket.closed.teams'  => 'Teams: Notificar cuando un ticket se marca como resuelto.',

            // --- ¡AÑADIDO! ---
            // Evento: Un ticket es descartado
            'ticket.discarded.in_app' => 'In-App: Cuando un ticket es descartado (cancelado).',
            'ticket.discarded.email'  => 'Email: Cuando un ticket es descartado (cancelado).',
            'ticket.discarded.teams'  => 'Teams: Notificar cuando un ticket es descartado.',
            // --- FIN DE LO AÑADIDO ---

            // Evento: Un ticket se pone en "Esperando Partes"
            'ticket.awaiting_parts.in_app' => 'In-App: Cuando un ticket se pausa esperando refacciones.',
            'ticket.awaiting_parts.email'  => 'Email: Cuando un ticket se pausa esperando refacciones.',
            'ticket.awaiting_parts.teams'  => 'Teams: Notificar cuando un ticket entra en espera de partes.',

            // Evento: Un ticket es escalado a Crítico
            'ticket.escalated.in_app' => 'In-App: Cuando un ticket es escalado a prioridad Crítica.',
            'ticket.escalated.email'  => 'Email: Cuando un ticket es escalado a prioridad Crítica.',
            'ticket.escalated.teams'  => 'Teams: Postear cuando un ticket es escalado a Crítico.',

            // Evento: Se reduce la prioridad de un ticket
            'ticket.downgraded.in_app' => 'In-App: When a ticket priority is downgraded.',
            'ticket.downgraded.email'  => 'Email: When a ticket priority is downgraded.',
            'ticket.downgraded.teams'  => 'Teams: Notify when a ticket priority is downgraded.',
        ],

        'Inspections' => [
            // Evento: Se completa una inspección (¡Sin fallas!)
            'inspection.completed.in_app' => 'In-App: Cuando se completa una inspección sin problemas.',
            'inspection.completed.email'  => 'Email: Cuando se completa una inspección sin problemas.',
            'inspection.completed.teams'  => 'Teams: Notificar cuando se completa una inspección sin problemas.',

            // Evento: Se completa una inspección CON fallas
            'inspection.failed.in_app' => 'In-App: Cuando se completa una inspección con fallas reportadas.',
            'inspection.failed.email'  => 'Email: Cuando se completa una inspección con fallas reportadas.',
            'inspection.failed.teams'  => 'Teams: Postear en un canal si una inspección reporta fallas.',
        ],

        'Maintenance' => [
            // Evento: Recordatorio de mantenimiento
            'maintenance.reminder.in_app' => 'In-App: Recordatorio de un mantenimiento programado.',
            'maintenance.reminder.email'  => 'Email: Recordatorio de un mantenimiento programado.',
            'maintenance.reminder.teams'  => 'Teams: Postear recordatorio de mantenimiento crítico.',

            // Evento: Mantenimiento vencido
            'maintenance.overdue.in_app' => 'In-App: Cuando un mantenimiento programado se vence.',
            'maintenance.overdue.email'  => 'Email: Cuando un mantenimiento programado se vence.',
            'maintenance.overdue.teams'  => 'Teams: Postear en un canal cuando un mantenimiento se vence.',
        ],
    ],
];
