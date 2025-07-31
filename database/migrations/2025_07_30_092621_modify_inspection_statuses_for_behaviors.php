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
        Schema::table('inspection_statuses', function (Blueprint $table) {
            //
            // Drop the foreign key constraint before dropping the column
            $table->dropForeign(['machine_status_id']);

            // Remove the old columns that are now handled by the behavior system
            $table->dropColumn([
                'auto_creates_ticket',
                'machine_status_id',
                'is_default',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspection_statuses', function (Blueprint $table) {
            //
            // Add the columns back if the migration is rolled back
            $table->boolean('auto_creates_ticket')->default(false)->after('severity');
            $table->foreignId('machine_status_id')->nullable()->after('auto_creates_ticket')->constrained('machine_statuses')->onDelete('set null');
            $table->boolean('is_default')->default(false)->after('text_color');
        });
    }
};
