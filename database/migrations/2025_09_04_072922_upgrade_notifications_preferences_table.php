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
        Schema::table('notification_preferences', function (Blueprint $table) {
            // Action 1: Drop the foreign key constraint first to unlock the column.
            $table->dropForeign(['user_id']);

            // Action 2: Now that the column is free, drop the old composite primary key.
            $table->dropPrimary(['user_id', 'notification_type']);

            // Action 3: Add a new, simple auto-incrementing 'id' column as the new primary key.
            $table->id()->first();

            // Action 4: Add the new, nullable polymorphic columns ("universal adapter").
            $table->nullableMorphs('preferable');

            // Action 5: Re-add the foreign key constraint to maintain data integrity.
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     * This 'down' method correctly reverses the changes, making the migration safe.
     */
    public function down(): void
    {
        Schema::table('notification_preferences', function (Blueprint $table) {
            // Reverses the process in the correct order.
            $table->dropForeign(['user_id']);
            $table->dropColumn('id');
            $table->dropMorphs('preferable');
            
            // Re-add the old composite primary key and its foreign key.
            $table->primary(['user_id', 'notification_type']);
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};

