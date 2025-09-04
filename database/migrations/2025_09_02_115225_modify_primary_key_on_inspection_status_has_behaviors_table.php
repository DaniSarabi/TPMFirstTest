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
        Schema::table('inspection_status_has_behaviors', function (Blueprint $table) {
            // 1. Drop the foreign keys first. We refer to them by the column name.
            $table->dropForeign(['inspection_status_id']);
            $table->dropForeign(['behavior_id']);
            // Also drop the tag foreign key just to be safe during the operation
            if (Schema::hasColumn('inspection_status_has_behaviors', 'tag_id')) {
                $table->dropForeign(['tag_id']);
            }

            // 2. Now that they are free, drop the old composite primary key.
            $table->dropPrimary(['inspection_status_id', 'behavior_id']);

            // 3. Add the new auto-incrementing primary key.
            $table->id()->first();

            // 4. Re-add the foreign key constraints to maintain data integrity.
            $table->foreign('inspection_status_id')->references('id')->on('inspection_statuses')->onDelete('cascade');
            $table->foreign('behavior_id')->references('id')->on('behaviors')->onDelete('cascade');
            if (Schema::hasColumn('inspection_status_has_behaviors', 'tag_id')) {
                 $table->foreign('tag_id')->references('id')->on('tags')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // The 'down' method does the exact reverse to keep your schema safe.
        Schema::table('inspection_status_has_behaviors', function (Blueprint $table) {
            $table->dropForeign(['inspection_status_id']);
            $table->dropForeign(['behavior_id']);
            if (Schema::hasColumn('inspection_status_has_behaviors', 'tag_id')) {
                $table->dropForeign(['tag_id']);
            }
            
            $table->dropColumn('id');

            $table->primary(['inspection_status_id', 'behavior_id']);
            
            $table->foreign('inspection_status_id')->references('id')->on('inspection_statuses')->onDelete('cascade');
            $table->foreign('behavior_id')->references('id')->on('behaviors')->onDelete('cascade');
            if (Schema::hasColumn('inspection_status_has_behaviors', 'tag_id')) {
                $table->foreign('tag_id')->references('id')->on('tags')->onDelete('cascade');
            }
        });
    }
};
