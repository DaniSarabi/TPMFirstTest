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
        Schema::create('ticket_update_photos', function (Blueprint $table) {
       $table->id();
            
            // This creates the foreign key link to the specific "closing" event in the ticket_updates table.
            // onDelete('cascade') ensures that if an update is deleted, its photos are also deleted.
            $table->foreignId('ticket_update_id')->constrained('ticket_updates')->onDelete('cascade');
            
            // This will store the path to the uploaded image file.
            $table->string('photo_url');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_update_photos');
    }
};
