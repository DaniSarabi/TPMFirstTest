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
        Schema::create('scheduled_maintenances', function (Blueprint $table) {
            $table->id();

            // Foreign key to the checklist we're using.
            $table->foreignId('maintenance_template_id')->constrained()->cascadeOnDelete();

            // This is a polymorphic relationship. It allows us to attach this schedule
            // to either a Machine or a Subsystem model.
            $table->morphs('schedulable');

            // The date the maintenance is planned for.
            $table->date('scheduled_date');

            // The current status of the maintenance task.
            $table->string('status')->default('scheduled'); // e.g., scheduled, in_progress, completed, overdue

            // --- Foundation for Notifications (Your Suggestion) ---

            // The number of days after the scheduled_date before it's considered overdue.
            $table->unsignedInteger('grace_period_days')->default(7);

            // The number of days before the scheduled_date to send a reminder. Nullable if no reminder is needed.
            $table->unsignedInteger('reminder_days_before')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scheduled_maintenances');
    }
};
