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
        Schema::table('maintenance_template_tasks', function (Blueprint $table) {
            // Se añade la nueva columna opcional para relacionar la tarea con una sección.
            // Es 'nullable' para permitir tareas que pertenecen directamente a la plantilla.
            // Se mantiene la columna 'maintenance_template_id'.
            $table->foreignId('section_id')
                ->nullable()
                ->after('maintenance_template_id')
                ->constrained('maintenance_template_sections')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maintenance_template_tasks', function (Blueprint $table) {
            // Se elimina la columna para que la migración sea reversible.
            $table->dropForeign(['section_id']);
            $table->dropColumn('section_id');
        });
    }
};
