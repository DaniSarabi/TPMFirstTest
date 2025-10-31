<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Define las categorías de downtime (nuevas y viejas).
     */
    private $newCategories = [
        'Corrective',
        'Awaiting Parts',
        'Preventive',
        'Other',
        'Awaiting Quote',        // <-- NUEVA
        'Awaiting Purchase',     // <-- NUEVA
        'Awaiting Delivery',     // <-- NUEVA
        'Awaiting External Vendor' // <-- NUEVA
    ];

    private $oldCategories = [
        'Corrective',
        'Awaiting Parts',
        'Preventive',
        'Other'
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Convertimos el array a un string formateado para SQL ENUM
        $enumList = "'" . implode("','", $this->newCategories) . "'";

        // Usamos DB::statement porque ->change() no es confiable para ENUMs
        DB::statement("ALTER TABLE downtime_logs MODIFY COLUMN category ENUM($enumList) NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $enumList = "'" . implode("','", $this->oldCategories) . "'";

        DB::statement("ALTER TABLE downtime_logs MODIFY COLUMN category ENUM($enumList) NOT NULL");
    }
};
