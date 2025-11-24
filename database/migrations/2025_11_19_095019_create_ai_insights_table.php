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
        Schema::create('ai_insights', function (Blueprint $table) {
            $table->id();
            // Relaciones Clave (Indexadas para velocidad)
            $table->foreignId('ticket_id')->constrained()->onDelete('cascade');
            $table->foreignId('machine_id')->constrained()->onDelete('cascade'); // Para el dashboard de máquina
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // El técnico (para coaching)

            // El contenido del Post-it
            $table->string('type')->index(); // COACHING_OPPORTUNITY, MACHINE_HEALTH_TIP, RECURRENCE_ALERT
            $table->text('content'); // El mensaje corto y accionable

            // Estado para el Admin Panel (Tu idea de "Validar/Descartar")
            $table->string('status')->default('pending'); // pending, validated, dismissed

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_insights');
    }
};
