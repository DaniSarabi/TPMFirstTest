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
        Schema::table('machine_statuses', function (Blueprint $table) {
            //
            $table->boolean('is_operational_default')->default(false)->after('is_protected');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('machine_statuses', function (Blueprint $table) {
            $table->dropColumn('is_operational_default');
        });
    }
};
