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
        Schema::table('downtime_logs', function (Blueprint $table) {
            //
            // Action 1: Remove the old, restrictive ticket_id column.
            // We must drop the foreign key constraint before dropping the column itself.
             if (Schema::hasColumn('downtime_logs', 'ticket_id')) {
                $table->dropForeign(['ticket_id']);
                $table->dropColumn('ticket_id');
            }
            
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');

            // Action 2: Replace the generic 'reason' text field.
            $table->dropColumn('reason');

            // Action 3: Add the new polymorphic columns ("universal adapter").
            // This adds 'downtimeable_id' and 'downtimeable_type' after the 'user_id' column.
            $table->morphs('downtimeable');

            // Action 4: Add the new structured 'category' column.
            // Using an ENUM ensures data consistency for reporting.
            $table->enum('category', [
                'Corrective',
                'Awaiting Parts',
                'Preventive',
                'Other',
            ])->after('downtimeable_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

        Schema::table('downtime_logs', function (Blueprint $table) {
            // This 'down' method correctly reverses the changes, making the migration safe.
            $table->dropMorphs('downtimeable');
            $table->dropColumn('category');

            // Re-add the old columns to restore the original table structure.
            $table->foreignId('ticket_id')->nullable()->constrained()->onDelete('set null');
            $table->string('reason')->nullable();
            $table->foreignId('user_id')->nullable();
        });
    }
};
