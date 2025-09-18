<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('machines', function (Blueprint $table) {
            $table->string('slug')->unique()->nullable()->after('name');
            // This allows existing machines to be part of a group without breaking anything.
            $table->foreignId('asset_group_id')->nullable()->after('id')->constrained('asset_groups')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('machines', function (Blueprint $table) {
            $table->dropForeign(['asset_group_id']);
            $table->dropColumn(['slug', 'asset_group_id']);
        });
    }
};
