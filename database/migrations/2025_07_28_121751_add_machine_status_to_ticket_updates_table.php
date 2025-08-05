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
        Schema::table('ticket_updates', function (Blueprint $table) {
            // This new column will store the ID of the machine status that was set.
            $table->foreignId('new_machine_status_id')->nullable()->after('new_status_id')->constrained('machine_statuses')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ticket_updates', function (Blueprint $table) {
            $table->dropForeign(['new_machine_status_id']);
            $table->dropColumn('new_machine_status_id');
        });
    }
};
