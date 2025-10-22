<?php

namespace App\Listeners;

use App\Events\InspectionCompleted;
use App\Events\RoleEdit;
use App\Events\TicketCreated;
use App\Events\UserCreated;
use App\Events\MachineStatusChanged;
use App\Events\MachineCreated;
use App\Models\User;
use App\Notifications\GeneralInAppNotification;
use Illuminate\Support\Facades\Notification;
use App\Events\TicketCommentAdded;
use App\Events\TicketStatusChanged;
use App\Events\MaintenanceReminderSent;
use App\Models\Machine;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendInAppNotificationListener 
{

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(object $event): void
    {
        // Este método se activará para cualquier evento que registremos.
        // Usaremos 'instanceof' para determinar qué tipo de evento ocurrió.
        // * Ticket events
        if ($event instanceof TicketCreated) {
            $this->handleTicketCreated($event);
        }
        if ($event instanceof TicketStatusChanged) {
            $this->handleTicketStatusChanged($event);
        }
        if ($event instanceof TicketCommentAdded) {
            $this->handleTicketCommentAdded($event);
        }

        // * Users and roles events
        if ($event instanceof UserCreated) {
            $this->handleUserCreated($event);
        }
        if ($event instanceof RoleEdit) {
            $this->handleRoleEdit($event);
        }

        if ($event instanceof InspectionCompleted) {
            $this->handleInspectionCompleted($event);
        }

        if ($event instanceof MaintenanceReminderSent) {
            $this->handleMaintenanceReminderSent($event);
        }
    }

    /**
     * Handle the MaintenanceReminderSent event.
     */
    private function handleMaintenanceReminderSent(MaintenanceReminderSent $event): void
    {
        $maintenance = $event->maintenance;
        $notificationType = 'maintenance.reminder';

        $machine = $maintenance->schedulable_type === 'App\\Models\\Machine'
            ? $maintenance->schedulable
            : $maintenance->schedulable->machine;

        if (!$machine) {
            return;
        } // Safety check

        $message = "Maintenance reminder for {$maintenance->title} on machine {$machine->name}.";
        $url = route('maintenance-calendar.index'); // Link to the calendar

        // The helper method will correctly find both global and machine-specific subscribers.
        $this->notifySubscribedUsers($notificationType, $message, $url, $machine);
    }

    /**
     * Handle the TicketCreated event.
     */
    private function handleTicketCreated(TicketCreated $event): void
    {
        $ticket = $event->ticket;
        $machine = $ticket->machine; // 1. Get the machine from the ticket
        $notificationType = 'ticket.created';

        $message = "New ticket (#{$ticket->id}) created for {$machine->name}.";
        $url = route('tickets.show', $ticket->id);

        // 2. Pass the machine to the notifier
        $this->notifySubscribedUsers($notificationType, $message, $url, $machine);
    }
    /**
     * Handle the TicketStatusChanged event.
     */
    private function handleTicketStatusChanged(TicketStatusChanged $event): void
    {
        $ticket = $event->ticketUpdate;
        $notificationType = 'ticket.status.changed';

        $message = "Ticket (#{$ticket->ticket->id}) has change his status to: {$ticket->ticket->status->name}.";
        $url = route('tickets.show', $ticket->ticket->id);

        $this->notifySubscribedUsers($notificationType, $message, $url);
    }
    /**
     * Handle the CommentAdded event.
     */
    private function handleTicketCommentAdded(TicketCommentAdded $event): void
    {
        $ticket = $event->ticketUpdate;
        $notificationType = 'ticket.comment.added';

        $message = "A comment has been added to the ticket (#{$ticket->ticket->id}) discussion.";
        $url = route('tickets.show', $ticket->ticket->id);

        $this->notifySubscribedUsers($notificationType, $message, $url);
    }
    /**
     * Handle the RoleEdit Event.
     */
    private function handleRoleEdit(RoleEdit $event): void
    {
        $role = $event->role;
        $notificationType = 'role.updated';

        $message = "The role {$role->name} has been updated";
        $url = route('roles.index');

        $this->notifySubscribedUsers($notificationType, $message, $url);
    }

    /**
     * Handle the UserCreated event.
     */
    private function handleUserCreated(UserCreated $event): void
    {
        $user = $event->user;
        $notificationType = 'user.created';

        $message = "A new user, {$user->name}, has been added to the system.";
        $url = route('users.index'); // A reasonable default URL

        $this->notifySubscribedUsers($notificationType, $message, $url);
    }

    /**
     * Handle the InspectionCompleted event.
     */
    private function handleInspectionCompleted(InspectionCompleted $event): void
    {
        $report = $event->inspectionReport;
        $notificationType = 'inspection.completed';

        $message = "Inspection report #{$report->id} for {$report->machine->name} has been completed.";
        $url = route('inspections.show', $report->id);

        $this->notifySubscribedUsers($notificationType, $message, $url);
    }



    /** * A reusable helper method to find and notify users.
     * It now accepts an optional Machine model to handle machine-specific subscriptions.
     */
    private function notifySubscribedUsers(string $notificationType, string $message, string $url, ?Machine $machine = null): void
    {
        // This method's logic is already perfect and doesn't need to change.
        $usersToNotify = User::whereHas('notificationPreferences', function ($query) use ($notificationType, $machine) {
            $query->where('notification_type', $notificationType)
                // This 'when' clause only runs if $machine is not null.
                ->when($machine, function ($q) use ($machine) {
                    $q->where(function ($subQuery) use ($machine) {
                        $subQuery->whereNull('preferable_id') // Global subscribers
                            ->orWhere(function ($machineQuery) use ($machine) {
                                // Machine-specific subscribers
                                $machineQuery->where('preferable_type', 'App\\Models\\Machine')
                                    ->where('preferable_id', $machine->id);
                            });
                    });
                }, function ($q) {
                    // This runs if $machine is null (for global-only notifications)
                    $q->whereNull('preferable_id');
                });
        })->get();

        if ($usersToNotify->isNotEmpty()) {
            Notification::send($usersToNotify, new GeneralInAppNotification($message, $url));
        }
    }
}
