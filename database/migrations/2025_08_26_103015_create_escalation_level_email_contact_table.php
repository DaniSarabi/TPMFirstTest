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
        Schema::create('escalation_level_email_contact', function (Blueprint $table) {
              $table->id();
            $table->foreignId('escalation_level_id')->constrained()->cascadeOnDelete();
            $table->foreignId('email_contact_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('escalation_level_email_contact');
    }
};
