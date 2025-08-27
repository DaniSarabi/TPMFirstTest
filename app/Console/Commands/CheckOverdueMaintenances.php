<?php

namespace App\Console\Commands;

use App\Models\EscalationPolicy;
use App\Models\ScheduledMaintenance;
use App\Mail\OverdueMaintenanceNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CheckOverdueMaintenances extends Command
{
    protected $signature = 'tpm:check-overdue-maintenances';
    protected $description = 'Check for overdue maintenance tasks and send notifications based on escalation policies.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for overdue maintenance tasks...');
        Log::info('TPM Scheduler: Starting overdue maintenance check...');

        $policy = EscalationPolicy::where('name', 'Overdue Maintenance')->where('is_active', true)->first();
        if (!$policy) {
            $this->warn('"Overdue Maintenance" policy not found or is inactive. Skipping.');
            return;
        }

        $maintenancesToCheck = ScheduledMaintenance::where('status', '!=', 'completed')->get();

        foreach ($maintenancesToCheck as $maintenance) {
            $dueDate = $maintenance->scheduled_date->addDays($maintenance->grace_period_days);

            if (Carbon::today()->gt($dueDate)) {
                if ($maintenance->status !== 'overdue') {
                    $maintenance->update(['status' => 'overdue']);
                    $this->line("  - Task '{$maintenance->title}' marked as Overdue.");
                }

                $this->sendEscalationEmails($policy, $maintenance, $dueDate);
            }
        }

        $this->info('Overdue maintenance check complete.');
    }

    private function sendEscalationEmails(EscalationPolicy $policy, ScheduledMaintenance $maintenance, Carbon $dueDate)
    {
        $daysOverdue = $dueDate->diffInDays(Carbon::today());

        // --- Depuración Avanzada: Registrar la consulta SQL ---
        DB::enableQueryLog(); // Habilitar el registro de consultas
        $levelToSend = $policy->levels()
            ->where('days_after', '<=', $daysOverdue)
            ->reorder('level', 'desc')
            ->first();

        $queryLog = DB::getQueryLog();
        Log::info("TPM Scheduler Query:", ['sql' => end($queryLog)['query'], 'bindings' => end($queryLog)['bindings']]);
        DB::disableQueryLog(); // Deshabilitar para no afectar el resto de la app

        Log::info("TPM Scheduler: Task #{$maintenance->id} is {$daysOverdue} days overdue. Looking for a notification level.");

        if ($levelToSend) {
            $contacts = $levelToSend->emailContacts;
            Log::info("TPM Scheduler: Found Level {$levelToSend->level} ({$levelToSend->days_after} days). Notifying {$contacts->count()} contacts.");
            if ($contacts->isNotEmpty()) {
                $this->line("  - Task '{$maintenance->title}' is {$daysOverdue} days overdue. Notifying Level {$levelToSend->level}.");
                foreach ($contacts as $contact) {
                    Mail::to($contact->email)->send(new OverdueMaintenanceNotification($maintenance));
                    $this->line("    - Email sent to {$contact->name}");
                }
            }
        } else {
            Log::info("TPM Scheduler: No escalation level found for a task that is {$daysOverdue} days overdue.");
        }
    }
}
