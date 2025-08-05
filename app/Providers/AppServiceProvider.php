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
            SendInAppNotificationListener::class
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

        //* Machines events
        Event::listen(
            MachineStatusChanged::class,
            SendInAppNotificationListener::class
        );
        Event::listen(
            MachineCreated::class,
            SendInAppNotificationListener::class
        );
    }
}
