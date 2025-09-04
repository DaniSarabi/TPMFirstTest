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
            // Action 1: Remove the old machine_status_id column.
            // It's important to drop the foreign key constraint before dropping the column.
            if (Schema::hasColumn('ticket_updates', 'new_machine_status_id')) {
                // The foreign key constraint is likely named 'ticket_updates_new_machine_status_id_foreign'
                $table->dropForeign(['new_machine_status_id']);
                $table->dropColumn('new_machine_status_id');
            }

            // Action 2: Add our new "universal adapter" polymorphic columns.
            // This will create 'loggable_id' and 'loggable_type'.
            $table->morphs('loggable');

            // Action 3: Add the new column to describe the action that was taken.
            $table->string('action')->nullable()->after('loggable_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ticket_updates', function (Blueprint $table) {
            // This 'down' method safely reverses the changes we made above.
            $table->dropMorphs('loggable');
            $table->dropColumn('action');

            // Re-create the old column. Note: the foreign key points to a table
            // that may no longer exist, so we just restore the column structure.
            $table->unsignedBigInteger('new_machine_status_id')->nullable();
        });
    }
};
