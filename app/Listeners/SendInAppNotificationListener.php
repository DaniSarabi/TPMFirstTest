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
        if ($event instanceof RoleEdit){
            $this->handleRoleEdit($event);
        }

        if ($event instanceof InspectionCompleted) {
            $this->handleInspectionCompleted($event);
        }

        // * Machines events
        if ($event instanceof MachineStatusChanged) {
            $this->handleMachineStatusChanged($event);
        }
        
    }

    /**
     * Handle the TicketCreated event.
     */
    private function handleTicketCreated(TicketCreated $event): void
    {
        $ticket = $event->ticket;
        $notificationType = 'ticket.created';

        $message = "New ticket (#{$ticket->id}) created for {$ticket->machine->name}.";
        $url = route('tickets.show', $ticket->id);

        $this->notifySubscribedUsers($notificationType, $message, $url);
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

    /**
     * Handle the MachineStatusChanged event.
    */
    private function handleMachineStatusChanged(MachineStatusChanged $event): void
    {
        $machine = $event->machine;
        $notificationType = 'machine.status.changed';

        $message = "Machine status for {$machine->name} has been updated to {$machine->machineStatus->name}.";
        $url = route('machines.show', $machine->id);

        $this->notifySubscribedUsers($notificationType, $message, $url);
    }
    

    /** 
     * A reusable helper method to find and notify users.
     */
    private function notifySubscribedUsers(string $notificationType, string $message, string $url): void
    {
        // 1. Find all users who have subscribed to this notification type.
        $usersToNotify = User::whereHas('notificationPreferences', function ($query) use ($notificationType) {
            $query->where('notification_type', $notificationType);
        })->get();

        // 2. Send the notification only to those users.
        if ($usersToNotify->isNotEmpty()) {
            Notification::send($usersToNotify, new GeneralInAppNotification($message, $url));
        }


        // TODO Do not notofy the user who triggered the event.
        //  $subscribedUsers = User::whereHas('notificationPreferences', function ($query) use ($notificationType) {
        //     $query->where('notification_type', $notificationType);
        // })->get();

        // // 2. Filter the list to exclude the user who triggered the event.
        // $usersToNotify = $subscribedUsers->where('id', '!=', $userWhoTriggeredEvent->id);

        // // 3. Send the notification only to the final list of users.
        // if ($usersToNotify->isNotEmpty()) {
        //     Notification::send($usersToNotify, new GeneralInAppNotification($message, $url));
        // }
    }
}
