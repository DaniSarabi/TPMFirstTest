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
        Schema::table('machines', function (Blueprint $table) {
            // Add the new foreign key column that links to the machine_statuses table.
            // We'll place it right after the 'description' column.
            $table->foreignId('machine_status_id')->after('description')->default(1)->constrained('machine_statuses');

            // Now that we have the new column, we can safely drop the old string-based status column.
            $table->dropColumn('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('machines', function (Blueprint $table) {
            // First, add the old 'status' column back.
            $table->string('status')->default('New')->after('description');

            // Then, drop the foreign key relationship and the new column.
            $table->dropForeign(['machine_status_id']);
            $table->dropColumn('machine_status_id');
        });
    }
};
