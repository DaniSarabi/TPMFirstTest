<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MaintenanceProgressSnapshot;
use Carbon\Carbon;

class MaintenanceProgressSnapshotSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Limpiamos la tabla para no duplicar datos en cada ejecución
        MaintenanceProgressSnapshot::query()->delete();

        $this->command->info('Generating historical maintenance progress snapshots...');

        // --- Generar datos para Septiembre 2025 ---
        $september = Carbon::create(2025, 9, 1);
        $totalTasksSeptember = 110; // Un número base de tareas para el mes
        
        for ($day = 1; $day <= $september->daysInMonth; $day++) {
            $currentDate = $september->copy()->day($day);
            
            // Simulamos un progreso que empieza lento y acelera al final del mes
            $progressFactor = ($day / $september->daysInMonth); // de 0 a 1
            $completedTasks = floor($totalTasksSeptember * $progressFactor * (0.8 + (rand(0, 100) / 500))); // Añadimos un poco de aleatoriedad
            $completedTasks = min($completedTasks, $totalTasksSeptember); // No puede haber más tareas completadas que el total

            $percentage = $totalTasksSeptember > 0 ? ($completedTasks / $totalTasksSeptember) * 100 : 0;

            MaintenanceProgressSnapshot::create([
                'date' => $currentDate,
                'completion_percentage' => $percentage,
                'completed_tasks' => $completedTasks,
                'total_tasks' => $totalTasksSeptember,
            ]);
        }
        
        $this->command->getOutput()->writeln(" <info>Generated</info> {$september->daysInMonth} snapshots for September 2025.");

        // --- Generar datos para Octubre 2025 (hasta el día de hoy) ---
        $october = Carbon::create(2025, 10, 1);
        $today = Carbon::today();
        $totalTasksOctober = 98; // El número de tareas que contamos manualmente
        
        // Solo generamos datos si estamos en Octubre 2025 o después
        if ($today->year < 2025 || ($today->year === 2025 && $today->month < 10)) {
            $this->command->info('Skipping October data as it is in the future.');
            return;
        }

        $daysToLog = min($today->day, $october->daysInMonth);

        for ($day = 1; $day <= $daysToLog; $day++) {
            $currentDate = $october->copy()->day($day);
            
            $progressFactor = ($day / $daysToLog);
            $completedTasks = floor($totalTasksOctober * $progressFactor * (0.7 + (rand(0, 100) / 500)));
            $completedTasks = min($completedTasks, $totalTasksOctober);

            $percentage = $totalTasksOctober > 0 ? ($completedTasks / $totalTasksOctober) * 100 : 0;

            MaintenanceProgressSnapshot::create([
                'date' => $currentDate,
                'completion_percentage' => $percentage,
                'completed_tasks' => $completedTasks,
                'total_tasks' => $totalTasksOctober,
            ]);
        }
        
        $this->command->getOutput()->writeln(" <info>Generated</info> {$daysToLog} snapshots for October 2025.");
        $this->command->info('Snapshot seeding complete!');
    }
}


    
