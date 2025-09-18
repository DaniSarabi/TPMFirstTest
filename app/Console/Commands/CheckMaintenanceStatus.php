<?php

namespace App\Console\Commands;

use App\Models\ScheduledMaintenance;
use App\Mail\MaintenanceReminderNotification;
use App\Models\User;
use App\Services\TagManagerService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use App\Mail\OverdueMaintenanceNotification;
use App\Events\MaintenanceReminderSent;
use App\Models\EscalationPolicy;
use Illuminate\Support\Facades\DB;
use App\Models\Subsystem;
use App\Models\Machine;

class CheckMaintenanceStatus extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'tpm:check-maintenance-status';

    /**
     * The console command description.
     */
    protected $description = 'Checks for upcoming and overdue maintenance tasks, sends notifications, and applies tags.';

    /**
     * Inject the TagManagerService.
     */
    public function __construct(protected TagManagerService $tagManager)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking maintenance statuses... .');
        Log::info('TPM Scheduler: Starting maintenance status check...');

        $maintenancesToCheck = ScheduledMaintenance::whereNotIn('status', ['completed', 'completed_overdue'])
            ->with(['template', 'schedulable' => function ($morphTo) {
                $morphTo->morphWith([
                    Machine::class => [],
                    Subsystem::class => ['machine'],
                ]);
            }])->get();

        Log::info("TPM Scheduler: Found {$maintenancesToCheck->count()} non-completed maintenance tasks to check.");

        foreach ($maintenancesToCheck as $maintenance) {
            if (!$maintenance->schedulable) {
                Log::warning("TPM Scheduler: Skipping maintenance #{$maintenance->id} because its schedulable item has been deleted.");
                continue;
            }
            $this->handleReminders($maintenance);
            $this->handleUpcomingTags($maintenance);
            $this->handleOverdueStatusAndTags($maintenance);
        }

        $this->info('Maintenance status check complete.');
        Log::info('TPM Scheduler: Finished maintenance status check.');
    }

    /**
     * Handles sending one-time email reminders.
     */
    private function handleReminders(ScheduledMaintenance $maintenance)
    {
        Log::info("TPM Scheduler: [Reminder Check] Processing maintenance #{$maintenance->id} ('{$maintenance->title}').");

        if ($maintenance->reminder_sent_at) {
            Log::info("TPM Scheduler: [Reminder Check] Skipping #{$maintenance->id}: Reminder already sent on {$maintenance->reminder_sent_at}.");
            return;
        }
        if (!$maintenance->reminder_days_before) {
            Log::info("TPM Scheduler: [Reminder Check] Skipping #{$maintenance->id}: No reminder days configured.");
            return;
        }

        $reminderDate = $maintenance->scheduled_date->subDays($maintenance->reminder_days_before);
        Log::info("TPM Scheduler: [Reminder Check] #{$maintenance->id}: Reminder date is {$reminderDate->toDateString()}. Today is " . Carbon::today()->toDateString() . ".");

        if (Carbon::today()->gte($reminderDate)) {
            Log::info("TPM Scheduler: [Reminder Check] #{$maintenance->id}: Reminder date has been reached. Searching for subscribers...");

            $machine = $maintenance->schedulable_type === 'App\\Models\\Machine'
                ? $maintenance->schedulable
                : $maintenance->schedulable->machine;

            if (!$machine) {
                Log::error("TPM Scheduler: [Reminder Check] Could not determine machine for maintenance #{$maintenance->id}.");
                return;
            }

            // Log the query that will be run
            $query = User::whereHas('notificationPreferences', function ($query) use ($machine) {
                $query->where('notification_type', 'maintenance.reminder')
                    ->where(function ($q) use ($machine) {
                        $q->whereNull('preferable_id')
                            ->orWhere(function ($q2) use ($machine) {
                                $q2->where('preferable_id', $machine->id)
                                    ->where('preferable_type', 'App\\Models\\Machine');
                            });
                    });
            });
            Log::info("TPM Scheduler: [Reminder Check] Finding users with query: " . $query->toSql());

            $usersToNotify = $query->get();

            Log::info("TPM Scheduler: [Reminder Check] Found {$usersToNotify->count()} users to notify for machine #{$machine->id}.");

            if ($usersToNotify->isNotEmpty()) {
                $this->line(" - Sending reminders for '{$maintenance->title}'.");
                foreach ($usersToNotify as $user) {
                    Log::info("TPM Scheduler: [Reminder Check] Sending email to {$user->email} for maintenance #{$maintenance->id}.");
                    Mail::to($user->email)->send(new MaintenanceReminderNotification($maintenance));
                }
            }

            $maintenance->update(['reminder_sent_at' => now()]);
            event(new MaintenanceReminderSent($maintenance));
            Log::info("TPM Scheduler: [Reminder Check] Marked maintenance #{$maintenance->id} as reminder sent.");
        } else {
            Log::info("TPM Scheduler: [Reminder Check] #{$maintenance->id}: Reminder date has not been reached yet.");
        }
    }

    /**
     * Handles applying the 'upcoming-maintenance' tag.
     */
    private function handleUpcomingTags(ScheduledMaintenance $maintenance)
    {
        $gracePeriodStartDate = $maintenance->scheduled_date->subDays($maintenance->grace_period_days);
        $machine = $maintenance->schedulable_type === 'App\\Models\\Machine'
            ? $maintenance->schedulable
            : $maintenance->schedulable->machine;

        if (Carbon::today()->gte($gracePeriodStartDate) && Carbon::today()->lte($maintenance->scheduled_date->addDays($maintenance->grace_period_days))) {
            $this->tagManager->applyTag($machine, 'maintenance-due', $maintenance);
        }
    }

    /**
     * Handles marking tasks as overdue, applying tags, and sending escalation emails.
     */
    private function handleOverdueStatusAndTags(ScheduledMaintenance $maintenance)
    {
        $dueDate = $maintenance->scheduled_date->addDays($maintenance->grace_period_days);
        $machine = $maintenance->schedulable_type === 'App\\Models\\Machine'
            ? $maintenance->schedulable
            : $maintenance->schedulable->machine;

        if (Carbon::today()->gt($dueDate)) {
            if ($maintenance->status !== 'overdue') {
                $maintenance->update(['status' => 'overdue']);
                $this->line(" - Task '{$maintenance->title}' marked as Overdue.");
            }

            $this->tagManager->removeTag($machine, 'maintenance-due', $maintenance);
            $this->tagManager->applyTag($machine, 'maintenance-overdue', $maintenance);

            $this->sendEscalationEmails($maintenance, $dueDate);
        }
    }

    /**
     * This method contains your original, preserved logic for sending escalation emails.
     */
    private function sendEscalationEmails(ScheduledMaintenance $maintenance, Carbon $dueDate)
    {
        $policy = EscalationPolicy::where('name', 'Overdue Maintenance')->where('is_active', true)->first();
        if (!$policy) {
            $this->warn(' - "Overdue Maintenance" policy not found or is inactive for escalation emails.');
            return;
        }

        $daysOverdue = $dueDate->diffInDays(Carbon::today());

        $levelToSend = $policy->levels()
            ->where('days_after', '<=', $daysOverdue)
            ->reorder('level', 'desc')
            ->first();

        if ($levelToSend) {
            $contacts = $levelToSend->emailContacts;
            if ($contacts->isNotEmpty()) {
                $this->line("   - Escalating '{$maintenance->title}'. Notifying Level {$levelToSend->level}.");
                foreach ($contacts as $contact) {
                    Mail::to($contact->email)->send(new OverdueMaintenanceNotification($maintenance));
                }
            }
        }
    }
}
