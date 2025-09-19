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
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            // La relación con AssetGroup. Opcional y se pone en NULL si el grupo se borra.
            $table->foreignId('asset_group_id')->nullable()->constrained('asset_groups')->onDelete('set null');
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('status')->default('operational');
            $table->string('image_url')->nullable();
            $table->timestamps();
            $table->softDeletes(); // Buena práctica para no perder datos
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
