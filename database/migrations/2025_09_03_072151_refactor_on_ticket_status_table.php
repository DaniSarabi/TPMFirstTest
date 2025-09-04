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
        Schema::table('ticket_status_has_behaviors', function (Blueprint $table) {
            // Action 1: Drop the foreign key that we know exists.
            // Based on your table structure, only the 'tag_id' foreign key is present.
            $table->dropForeign(['tag_id']);

            // Action 2: Drop the old composite primary key.
            $table->dropPrimary(['ticket_status_id', 'behavior_id']);

            // Action 3: Add the new, simple auto-incrementing 'id' column as the new primary key.
            $table->id()->first();

            // Action 4: Re-add all foreign key constraints correctly to ensure data integrity.
            $table->foreign('ticket_status_id')->references('id')->on('ticket_statuses')->onDelete('cascade');
            $table->foreign('behavior_id')->references('id')->on('behaviors')->onDelete('cascade');
            $table->foreign('tag_id')->references('id')->on('tags')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ticket_status_has_behaviors', function (Blueprint $table) {
            // Reverses the process in the correct order.
            $table->dropForeign(['ticket_status_id']);
            $table->dropForeign(['behavior_id']);
            $table->dropForeign(['tag_id']);

            $table->dropColumn('id');

            // The reference to 'machine_status_id' has been completely removed.
            $table->primary(['ticket_status_id', 'behavior_id']);

            $table->foreign('ticket_status_id')->references('id')->on('ticket_statuses')->onDelete('cascade');
            $table->foreign('behavior_id')->references('id')->on('behaviors')->onDelete('cascade');
            // Re-add the original tag foreign key on rollback
            $table->foreign('tag_id')->references('id')->on('tags')->onDelete('cascade');
        });
    }
};
