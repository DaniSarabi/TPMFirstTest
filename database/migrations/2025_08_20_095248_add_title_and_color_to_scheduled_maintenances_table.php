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
        Schema::table('scheduled_maintenances', function (Blueprint $table) {
            // Add the new title column after the status
            $table->string('title')->after('status');

            // Add the new nullable color column after the title
            $table->string('color', 7)->nullable()->after('title'); // 7 chars for #RRGGBB
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scheduled_maintenances', function (Blueprint $table) {
            $table->dropColumn(['title', 'color']);
        });
    }
};
