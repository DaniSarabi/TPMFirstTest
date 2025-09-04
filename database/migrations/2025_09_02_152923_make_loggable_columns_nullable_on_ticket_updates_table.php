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
Schema::table('ticket_updates', function (Blueprint $table) {
        // We are telling the database to modify these two columns
        // and allow them to be nullable.
        $table->string('loggable_type')->nullable()->change();
        $table->unsignedBigInteger('loggable_id')->nullable()->change();
    });    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
