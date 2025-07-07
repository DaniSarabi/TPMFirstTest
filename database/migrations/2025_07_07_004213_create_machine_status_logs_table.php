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
        Schema::create('machine_status_logs', function (Blueprint $table) {
            $table->id();
            // Foreign key to the machines table.
            // If a machine is deleted, all of its status logs will also be deleted.
            $table->foreignId('machine_id')->constrained('machines')->onDelete('cascade');

            // The status of the machine at the time of the log entry.
            $table->string('status');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('machine_status_logs');
    }
};
