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
        Schema::create('maintenance_photos', function (Blueprint $table) {
            $table->id();

            // Link to the specific task result this photo belongs to.
            $table->foreignId('maintenance_report_result_id')->constrained()->cascadeOnDelete();

            // The path to the stored photo file.
            $table->string('photo_url');

            $table->timestamps();
        });

        // Now, we can safely remove the old single photo column from the results table.
        Schema::table('maintenance_report_results', function (Blueprint $table) {
            $table->dropColumn('photo_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_photos');

        // Re-add the old column if we roll back the migration.
        Schema::table('maintenance_report_results', function (Blueprint $table) {
            $table->string('photo_url')->nullable()->after('comment');
        });
    }
};
