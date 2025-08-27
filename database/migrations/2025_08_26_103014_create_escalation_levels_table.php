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
        Schema::create('escalation_levels', function (Blueprint $table) {
                 $table->id();
            $table->foreignId('escalation_policy_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('level'); // e.g., 1, 2, 3
            $table->unsignedInteger('days_after'); // Cuántos días después se activa
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('escalation_levels');
    }
};
