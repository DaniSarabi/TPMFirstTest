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
        Schema::table('tickets', function (Blueprint $table) {
            // Columna para guardar el JSON estructurado del análisis de la IA
            // Lo ponemos después de priority para mantener el orden
            $table->json('ai_analysis_json')->nullable()->after('priority');

            // Columna para marcar cuándo fue procesado (y evitar procesarlo dos veces)
            $table->timestamp('ai_processed_at')->nullable()->after('ai_analysis_json');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('ai_analysis_json');
            $table->dropColumn('ai_processed_at');
        });
    }
};
