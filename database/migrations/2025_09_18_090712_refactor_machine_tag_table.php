<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Rename the table
        Schema::rename('machine_tag', 'taggables');

        // Step 2: Modify the structure to be polymorphic
        Schema::table('taggables', function (Blueprint $table) {
            // FIX: Drop BOTH original foreign keys before changing the structure.
            // We assume the original FK names followed Laravel's convention.
            $table->dropForeign('machine_tag_machine_id_foreign');
            $table->dropForeign('machine_tag_tag_id_foreign');

            // Now, modify the columns
            $table->renameColumn('machine_id', 'taggable_id');
            $table->string('taggable_type')->after('taggable_id');

            // Finally, redefine the primary key
            $table->dropPrimary(); // Drop old composite key ['machine_id', 'tag_id']
            $table->primary(['tag_id', 'taggable_id', 'taggable_type'], 'taggables_primary'); // Define the new polymorphic one
        });

        // Step 3: Backfill the existing data with the correct type
        DB::table('taggables')->update(['taggable_type' => 'App\\Models\\Machine']);
    }

    public function down(): void
    {
        // Step 1: Delete any data that isn't from the original Machine model
        DB::table('taggables')->where('taggable_type', '!=', 'App\\Models\\Machine')->delete();

        // Step 2: Revert the table structure
        Schema::table('taggables', function (Blueprint $table) {
            // Drop the complex polymorphic primary key
            $table->dropPrimary('taggables_primary');

            // Remove the polymorphic column
            $table->dropColumn('taggable_type');

            // Rename the ID column back to its original name
            $table->renameColumn('taggable_id', 'machine_id');

            // Re-add the original simple primary key
            $table->primary(['machine_id', 'tag_id']);

            // FIX: Re-add BOTH original foreign keys
            $table->foreign('machine_id')->references('id')->on('machines')->onDelete('cascade');
            $table->foreign('tag_id')->references('id')->on('tags')->onDelete('cascade');
        });

        // Step 3: Rename the table back to its original name
        Schema::rename('taggables', 'machine_tag');
    }
};
