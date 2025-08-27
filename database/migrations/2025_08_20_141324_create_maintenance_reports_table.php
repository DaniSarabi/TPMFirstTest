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
        Schema::create('maintenance_reports', function (Blueprint $table) {
           $table->id();

            // Link to the scheduled event this report is for.
            $table->foreignId('scheduled_maintenance_id')->constrained()->cascadeOnDelete();

            // Link to the user who performed the maintenance.
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // General notes about the maintenance.
            $table->text('notes')->nullable();

            // The date and time the maintenance was actually completed.
            $table->timestamp('completed_at');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_reports');
    }
};
