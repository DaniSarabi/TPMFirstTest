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
        Schema::create('inspection_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->integer('severity')->default(0);
            $table->boolean('auto_creates_ticket')->default(false);
            $table->string('sets_machine_status_to')->nullable();
            $table->string('bg_color')->nullable();
            $table->string('text_color')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspection_statuses');
    }
};
