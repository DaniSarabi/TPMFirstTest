<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('maintenance_progress_snapshots', function (Blueprint $table) {
            $table->id();

            // La fecha en que se tomó la "foto" del progreso.
            // Se indexa para que las consultas por fecha sean súper rápidas.
            $table->date('date')->index();

            // El porcentaje de completado para esa fecha. ej. 85.50
            $table->decimal('completion_percentage', 5, 2);

            // El número de tareas interactivas completadas hasta esa fecha.
            $table->unsignedInteger('completed_tasks');

            // El número total de tareas interactivas programadas para ese mes.
            $table->unsignedInteger('total_tasks');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_progress_snapshots');
    }
};
