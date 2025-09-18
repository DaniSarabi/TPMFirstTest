<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            // This is the key field from your plan to determine maintenance type
            $table->enum('maintenance_type', ['group', 'individual'])->default('individual');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_groups');
    }
};
