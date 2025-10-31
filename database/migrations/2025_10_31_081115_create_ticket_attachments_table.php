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
        Schema::create('ticket_attachments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique(); // <-- Para URLs y uso público
            $table->foreignId('ticket_id')->constrained()->onDelete('cascade');
            $table->foreignId('uploaded_by')->constrained('users');
            $table->string('file_name'); // "Cotizacion_Proveedor_X.pdf"
            $table->string('file_path'); // "ticket_attachments/abc123.pdf"
            $table->string('file_type'); // "application/pdf", "message/rfc822" (para .eml)
            $table->unsignedBigInteger('file_size'); // en bytes
            $table->text('description')->nullable(); // "Cotización del proveedor ABC"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_attachments');
    }
};
