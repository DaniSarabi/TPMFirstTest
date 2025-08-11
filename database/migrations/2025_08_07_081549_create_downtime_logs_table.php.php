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
        Schema::create('downtime_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machine_id')->constrained('machines')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('ticket_id')->nullable()->constrained('tickets')->onDelete('set null');
            $table->timestamp('start_time');
            $table->timestamp('end_time')->nullable();
            $table->string('reason'); // e.g., 'Maintenance', 'Awaiting Parts'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('downtime_logs');
    }
};
