<?php

namespace App\Services;

use App\Models\Machine;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use stdClass; // ACTION: Se importa la clase estándar de PHP para el tipado.

class MachineHealthService
{
    /**
     * Calcula las estadísticas de salud de una máquina para un periodo determinado.
     *
     * @return object{health_score: int, total_items: int, ok_count: int, warning_count: int, critical_count: int}
     */
    public function getHealthStatsForPeriod(Machine $machine, Carbon $startDate, Carbon $endDate): object
    {
        $stats = DB::table('inspection_report_items')
            ->join('inspection_reports', 'inspection_report_items.inspection_report_id', '=', 'inspection_reports.id')
            ->join('inspection_statuses', 'inspection_report_items.inspection_status_id', '=', 'inspection_statuses.id')
            ->where('inspection_reports.machine_id', $machine->id)
            ->whereBetween('inspection_reports.completed_at', [$startDate, $endDate])
            ->selectRaw("
                COUNT(*) as total_items,
                SUM(CASE WHEN inspection_statuses.severity = 0 THEN 1 ELSE 0 END) as ok_count,
                SUM(CASE WHEN inspection_statuses.severity = 1 THEN 1 ELSE 0 END) as warning_count,
                SUM(CASE WHEN inspection_statuses.severity = 2 THEN 1 ELSE 0 END) as critical_count
            ")
            ->first();

        $healthScore = 100;

        if ($stats->total_items > 0) {
            $scoreObtenido = ($stats->ok_count * 1) + ($stats->warning_count * 0.5) + ($stats->critical_count * 0);
            $scorePosible = $stats->total_items * 1;
            $healthScore = (int) round(($scoreObtenido / $scorePosible) * 100);
        }

        // ACTION: Se devuelve un objeto estándar con toda la data que necesita el frontend.
        return (object) [
            'health_score' => $healthScore,
            'total_items' => (int) $stats->total_items,
            'ok_count' => (int) $stats->ok_count,
            'warning_count' => (int) $stats->warning_count,
            'critical_count' => (int) $stats->critical_count,
        ];
    }
}
