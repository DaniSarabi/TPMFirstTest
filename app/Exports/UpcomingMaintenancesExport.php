<?php

namespace App\Exports;

use App\Models\Machine;
use App\Models\ScheduledMaintenance;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Carbon\Carbon;

class UpcomingMaintenancesExport implements FromCollection, WithHeadings, WithMapping
{
    protected $machine;

    public function __construct(Machine $machine)
    {
        $this->machine = $machine;
    }

    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        $subsystemIds = $this->machine->subsystems->pluck('id');

        // Esta es la misma consulta robusta que usamos en la página de detalles.
        return ScheduledMaintenance::query()
            ->where(function ($query) use ($subsystemIds) {
                $query->where(function ($q) {
                    $q->where('schedulable_type', 'App\\Models\\Machine')
                      ->where('schedulable_id', $this->machine->id);
                })
                ->orWhere(function ($q) use ($subsystemIds) {
                    $q->where('schedulable_type', 'App\\Models\\Subsystem')
                      ->whereIn('schedulable_id', $subsystemIds);
                });
            })
            ->whereNotIn('status', ['completed', 'completed_overdue'])
            ->with('schedulable') // Cargar la relación para el mapeo
            ->orderBy('scheduled_date', 'asc')
            ->get();
    }

    /**
     * Define los encabezados de las columnas en el archivo Excel.
     */
    public function headings(): array
    {
        return [
            'ID',
            'Title',
            'Target Type',
            'Target Name',
            'Scheduled Date',
            'Due Date (with Grace Period)',
            'Status',
        ];
    }

    /**
     * Mapea y formatea cada fila de datos.
     */
    public function map($maintenance): array
    {
        $dueDate = Carbon::parse($maintenance->scheduled_date)->addDays($maintenance->grace_period_days);

        return [
            $maintenance->id,
            $maintenance->title,
            class_basename($maintenance->schedulable_type),
            $maintenance->schedulable->name,
            $maintenance->scheduled_date->format('Y-m-d'),
            $dueDate->format('Y-m-d'),
            ucwords(str_replace('_', ' ', $maintenance->status)),
        ];
    }
}
