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
        Schema::table('machine_status_logs', function (Blueprint $table) {
            //
              // Add the new foreign key column.
            $table->foreignId('machine_status_id')->after('machine_id')->constrained('machine_statuses');
            // Drop the old string-based status column.
            $table->dropColumn('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('machine_status_logs', function (Blueprint $table) {
            //
            // Add the old 'status' column back.
            $table->string('status')->after('machine_id');
            // Drop the foreign key relationship and the new column.
            $table->dropForeign(['machine_status_id']);
            $table->dropColumn('machine_status_id');
        });
    }
};
