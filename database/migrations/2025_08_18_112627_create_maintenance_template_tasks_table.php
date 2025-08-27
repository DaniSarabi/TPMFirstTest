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
        Schema::create('maintenance_template_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('maintenance_template_id')->constrained()->cascadeOnDelete();
            $table->integer('order')->default(0);
            $table->string('task_type');
            $table->string('label');
            $table->json('options')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_template_tasks');
    }
};
