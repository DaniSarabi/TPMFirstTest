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
        Schema::table('machines', function (Blueprint $table) {
            // Primero, eliminamos la restricción de la clave foránea.
            // El nombre de la restricción puede variar, pero Laravel generalmente lo nombra así.
            // Si obtienes un error, revisa el nombre exacto en tu base de datos.
            $table->dropForeign(['machine_status_id']);

            // Ahora, eliminamos la columna.
            $table->dropColumn('machine_status_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('machines', function (Blueprint $table) {
            // Esto nos permite revertir la migración si es necesario.
            $table->foreignId('machine_status_id')->nullable()->constrained('machine_statuses');
        });
    }
};
