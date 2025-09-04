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
        // --- Tabla de Estados de Inspección ---
        Schema::table('inspection_status_has_behaviors', function (Blueprint $table) {
            // 1. Primero, eliminamos la antigua restricción de clave foránea.
            // Laravel nombra estas restricciones automáticamente. Si esto falla,
            // revisa el nombre exacto de la restricción en tu cliente de base de datos.
            $table->dropForeign(['machine_status_id']);

            // 2. Ahora, renombramos la columna.
            $table->renameColumn('machine_status_id', 'tag_id');
        });
        // Lo hacemos en un 'Schema::table' separado para asegurar que el renombramiento se complete.
        Schema::table('inspection_status_has_behaviors', function (Blueprint $table) {
            // 3. Finalmente, añadimos la nueva y correcta restricción de clave foránea.
            $table->foreign('tag_id')->references('id')->on('tags')->onDelete('cascade');
        });


        // --- Tabla de Estados de Ticket ---
        Schema::table('ticket_status_has_behaviors', function (Blueprint $table) {
            // 1. Eliminar la antigua restricción.
            $table->dropForeign(['machine_status_id']);
            // 2. Renombrar la columna.
            $table->renameColumn('machine_status_id', 'tag_id');
        });
        Schema::table('ticket_status_has_behaviors', function (Blueprint $table) {
            // 3. Añadir la nueva y correcta restricción.
            $table->foreign('tag_id')->references('id')->on('tags')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Lógica para revertir los cambios si es necesario
        Schema::table('inspection_status_has_behaviors', function (Blueprint $table) {
            $table->dropForeign(['tag_id']);
            $table->renameColumn('tag_id', 'machine_status_id');
        });
         Schema::table('inspection_status_has_behaviors', function (Blueprint $table) {
            $table->foreign('machine_status_id')->references('id')->on('machine_statuses')->onDelete('cascade');
        });


        Schema::table('ticket_status_has_behaviors', function (Blueprint $table) {
            $table->dropForeign(['tag_id']);
            $table->renameColumn('tag_id', 'machine_status_id');
        });
        Schema::table('ticket_status_has_behaviors', function (Blueprint $table) {
            $table->foreign('machine_status_id')->references('id')->on('machine_statuses')->onDelete('cascade');
        });
    }
};

