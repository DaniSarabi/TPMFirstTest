<?php

namespace App\Providers;

use App\Events\InspectionCompleted;
use App\Events\TicketCreated;
use App\Events\TicketCommentAdded;
use App\Events\TicketStatusChanged;
use App\Events\RoleEdit;
use App\Events\UserCreated;
use App\Events\MachineStatusChanged;
use App\Events\MachineCreated;
use App\Listeners\SendInAppNotificationListener;
use App\Models\TicketUpdate;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use App\Events\MaintenanceReminderSent;
use App\Listeners\SendNewTicketEmailNotification;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {

        // * Tickets events
        Event::listen(
            TicketCreated::class,
            SendInAppNotificationListener::class,
            //  SendNewTicketEmailNotification::class
        );
        Event::listen(
            TicketStatusChanged::class,
            SendInAppNotificationListener::class
        );
        Event::listen(
            TicketCommentAdded::class,
            SendInAppNotificationListener::class
        );

        // * User and Roles events
        Event::listen(
            UserCreated::class,
            SendInAppNotificationListener::class
        );
        Event::listen(
            RoleEdit::class,
            SendInAppNotificationListener::class
        );

        //* Inspections events
        Event::listen(
            InspectionCompleted::class,
            SendInAppNotificationListener::class
        );


        Event::listen(
            MachineCreated::class,
            SendInAppNotificationListener::class
        );
        // This tells Laravel to trigger our listener whenever a reminder is sent.
        Event::listen(
            MaintenanceReminderSent::class,
            SendInAppNotificationListener::class
        );
    }
}
