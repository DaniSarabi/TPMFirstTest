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
        Schema::create('ticket_status_has_behaviors', function (Blueprint $table) {
            $table->foreignId('ticket_status_id')->constrained('ticket_statuses')->onDelete('cascade');
            $table->foreignId('behavior_id')->constrained('behaviors')->onDelete('cascade');

            $table->foreignId('machine_status_id')->nullable()->constrained('machine_statuses')->onDelete('set null');

            $table->primary(['ticket_status_id', 'behavior_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_status_has_behaviors');
    }
};
