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
        Schema::table('inspection_report_items', function (Blueprint $table) {
            $table->foreignId('pinged_ticket_id')->nullable()->after('image_url')->constrained('tickets')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspection_report_items', function (Blueprint $table) {
            $table->dropForeign(['pinged_ticket_id']);
            $table->dropColumn('pinged_ticket_id');
        });
    }
};
