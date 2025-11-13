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
use App\Events\MaintenanceBecameOverdue;
use App\Models\EscalationPolicy;
use Illuminate\Support\Facades\DB;
use App\Models\Subsystem;
use App\Models\Machine;
use App\Models\MaintenanceProgressSnapshot;

class CheckMaintenanceStatus extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'tpm:check-maintenance-status';

    /**
     * The console command description.
     */
    protected $description = 'Checks for upcoming and overdue maintenance tasks, sends notifications, applies tags, and logs daily progress.';

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
            // --- 2. ¡LÓGICA REFACTORIZADA! ---
            $this->handleReminders($maintenance);
            $this->handleUpcomingTags($maintenance);
            $this->handleOverdueStatusAndTags($maintenance);
        }
        $this->logMaintenanceProgressSnapshot();


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
            Log::info("TPM Scheduler: [Reminder Check] Skipping #{$maintenance->id}: Reminder already sent.");
            return;
        }
        if (!$maintenance->reminder_days_before) {
            Log::info("TPM Scheduler: [Reminder Check] Skipping #{$maintenance->id}: No reminder days configured.");
            return;
        }

        $reminderDate = $maintenance->scheduled_date->subDays($maintenance->reminder_days_before);
        Log::info("TPM Scheduler: [Reminder Check] #{$maintenance->id}: Reminder date is {$reminderDate->toDateString()}. Today is " . Carbon::today()->toDateString() . ".");

        if (Carbon::today()->gte($reminderDate)) {
            Log::info("TPM Scheduler: [Reminder Check] #{$maintenance->id}: Reminder date reached. Firing event.");

            // --- 3. ¡LÓGICA LIMPIA! ---
            // Solo actualizamos el flag y disparamos el evento.
            // El "Cartero" (NotifyUsersAboutMaintenanceReminder) hará el resto.
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
     * Handles marking tasks as overdue, applying tags, and firing the overdue event.
     */
    private function handleOverdueStatusAndTags(ScheduledMaintenance $maintenance)
    {
        $dueDate = $maintenance->scheduled_date->addDays($maintenance->grace_period_days);
        $machine = $maintenance->schedulable_type === 'App\\Models\\Machine'
            ? $maintenance->schedulable
            : $maintenance->schedulable->machine;

        if (Carbon::today()->gt($dueDate)) {

            $wasAlreadyOverdue = $maintenance->status === 'overdue' || $maintenance->status === 'in_progress_overdue';

            if (!$wasAlreadyOverdue) {
                // 4. Actualizamos el estatus (ej. 'pending' -> 'overdue')
                $newStatus = $maintenance->status === 'in_progress' ? 'in_progress_overdue' : 'overdue';
                $maintenance->update(['status' => $newStatus]);
                $this->line(" - Task '{$maintenance->title}' marked as Overdue.");

                // --- 5. ¡LÓGICA NUEVA! ---
                // Disparamos el evento solo la PRIMERA VEZ que se marca como vencido.
                Log::info("TPM Scheduler: [Overdue Check] #{$maintenance->id} is now overdue. Firing event.");
                event(new MaintenanceBecameOverdue($maintenance));
            }

            $this->tagManager->removeTag($machine, 'maintenance-due', $maintenance);
            $this->tagManager->applyTag($machine, 'maintenance-overdue', $maintenance);

            // La lógica de escalación por email ahora se manejará
            // dentro del listener (NotifyUsersAboutMaintenanceOverdue),
            // pero la dejaremos aquí por ahora para no romper la EscalationPolicy.
            //$this->sendEscalationEmails($maintenance, $dueDate);
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

    /**
     * Calculates and logs the daily maintenance completion progress for the current month.
     */
    private function logMaintenanceProgressSnapshot()
    {
        $this->info('Logging daily maintenance progress snapshot...');
        Log::info('TPM Scheduler: Starting daily maintenance progress snapshot calculation.');

        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        $maintenancesThisMonth = ScheduledMaintenance::with([
            'report.results:id,maintenance_report_id,result,task_label',
            'template.tasks',
            'template.sections.tasks'
        ])
            ->whereBetween('scheduled_date', [$startOfMonth, $endOfMonth])
            ->whereHasMorph('schedulable', [Machine::class]) // This is the key!
            ->get();


        if ($maintenancesThisMonth->isEmpty()) {
            Log::info('TPM Scheduler: No scheduled maintenances for Machines found this month.');
            // Still log a zero-progress snapshot if none exist
            MaintenanceProgressSnapshot::updateOrCreate(['date' => today()], [
                'completion_percentage' => 0,
                'completed_tasks' => 0,
                'total_tasks' => 0,
            ]);
            return;
        }

        $totalTasksInMonth = 0;
        $completedTasksInMonth = 0;

        foreach ($maintenancesThisMonth as $maintenance) {
            if (!$maintenance->template) continue;

            $rootTasks = $maintenance->template->tasks ?? collect();
            $sectionTasks = $maintenance->template->sections->flatMap(fn($section) => $section->tasks) ?? collect();
            $allTasks = $rootTasks->merge($sectionTasks);

            $interactiveTasks = $allTasks->filter(
                fn($task) => !in_array($task->task_type, ['header', 'paragraph', 'bullet_list'])
            );

            $totalTasksInMonth += $interactiveTasks->count();

            if ($maintenance->report) {
                $completedCount = $interactiveTasks->filter(function ($task) use ($maintenance) {
                    $result = $maintenance->report->results->firstWhere('task_label', $task->label);
                    return $result && $result->result !== null && $result->result !== '';
                })->count();
                $completedTasksInMonth += $completedCount;
            }
        }

        $percentage = $totalTasksInMonth > 0 ? ($completedTasksInMonth / $totalTasksInMonth) * 100 : 0;

        MaintenanceProgressSnapshot::updateOrCreate(
            ['date' => today()],
            [
                'completion_percentage' => $percentage,
                'completed_tasks' => $completedTasksInMonth,
                'total_tasks' => $totalTasksInMonth,
            ]
        );

        $this->info("Snapshot logged: {$completedTasksInMonth}/{$totalTasksInMonth} tasks completed ({$percentage}%).");
        Log::info("TPM Scheduler: Snapshot logged. Progress: {$completedTasksInMonth}/{$totalTasksInMonth} ({$percentage}%).");
    }
}
