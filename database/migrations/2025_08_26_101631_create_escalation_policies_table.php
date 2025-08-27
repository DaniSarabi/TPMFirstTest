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
        Schema::create('escalation_policies', function (Blueprint $table) {
             $table->id();
            $table->string('name')->unique(); // e.g., "Mantenimiento Atrasado"
            $table->text('description')->nullable();
            // Para futuras implementaciones, podríamos querer asociar esto a un modelo específico.
            // $table->string('model_type')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('escalation_policies');
    }
};
