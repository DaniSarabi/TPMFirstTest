<?php

namespace App\Exports;

use App\Models\Machine;
use App\Models\ScheduledMaintenance;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use Maatwebsite\Excel\Concerns\WithTitle;

class MaintenancePlanExport implements FromArray, WithEvents, WithTitle
{
    protected $machine;
    protected $year;
    protected $maintenances;
    protected $data;

    public function __construct(Machine $machine, int $year)
    {
        $this->machine = $machine;
        $this->year = $year;
        $this->maintenances = $this->fetchData();
        $this->data = $this->structureData();
    }

    /**
     * @return string
     */
    public function title(): string
    {
        return 'Maintenance Plan ' . $this->year;
    }

    /**
     * Prepara y estructura todos los datos para la hoja de cálculo.
     */
    public function array(): array
    {
        return $this->data;
    }

    /**
     * Busca todos los mantenimientos necesarios.
     */
    private function fetchData()
    {
        $subsystemIds = $this->machine->subsystems->pluck('id');

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
            ->whereYear('scheduled_date', $this->year)
            ->with(['schedulable', 'template'])
            ->orderBy('title')
            ->get();
    }

    /**
     * Construye la matriz 2D que representa la hoja de cálculo.
     */
    private function structureData(): array
    {
        $data = [];

        foreach ($this->maintenances as $maintenance) {
            $weekNumber = (int)$maintenance->scheduled_date->format('W');
            $weekData = array_fill(1, 52, ''); // Crea 52 semanas vacías
            $weekData[$weekNumber] = $maintenance->status; // Pone el estado en la semana correcta

            $data[] = array_merge(
                [
                    $maintenance->title,
                    $maintenance->schedulable->name,
                    $maintenance->template->category ?? 'N/A', // Frecuencia
                ],
                array_values($weekData)
            );
        }

        return $data;
    }

    /**
     * Registra los eventos para aplicar estilos después de que se cree la hoja.
     */
    public function registerEvents(): array
    {
        $statusColors = [
            'scheduled' => 'FFFF00', // Amarillo
            'in_progress' => '00B0F0', // Azul claro
            'in_progress_overdue' => 'FFC000', // Naranja
            'completed' => '92D050', // Verde
            'completed_overdue' => '00B050', // Verde oscuro
            'overdue' => 'FF0000', // Rojo
        ];

        return [
            AfterSheet::class => function (AfterSheet $event) use ($statusColors) {
                $sheet = $event->sheet->getDelegate();

                // --- Construir los Encabezados ---
                $sheet->insertNewRowBefore(1, 4);
                $sheet->setCellValue('A1', 'ANNUAL MAINTENANCE PLAN ' . $this->year . ' - ' . $this->machine->name);
                $sheet->mergeCells('A1:BC1');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
                $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                $sheet->setCellValue('A3', 'Activity');
                $sheet->setCellValue('B3', 'Equipment / Subsystem');
                $sheet->setCellValue('C3', 'Frequency');
                $sheet->getStyle('A3:C3')->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
                $sheet->getStyle('A3:C3')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4472C4');


                // Encabezados de Mes y Semana
                $col = 'D';
                for ($m = 1; $m <= 12; $m++) {
                    $monthName = strtoupper(date('F', mktime(0, 0, 0, $m, 10)));
                    $startCol = $col;
                    $endCol = $this->advanceColumn($col, 3);

                    $sheet->setCellValue($startCol . '3', $monthName);
                    if ($startCol !== $endCol) {
                        $sheet->mergeCells($startCol . '3:' . $endCol . '3');
                    }
                    $sheet->getStyle($startCol . '3:' . $endCol . '3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle($startCol . '3:' . $endCol . '3')->getFont()->setBold(true);

                    for ($w = 1; $w <= 4; $w++) {
                        $weekIndex = (($m - 1) * 4) + $w;
                        if ($weekIndex <= 52) {
                            $sheet->setCellValue($this->advanceColumn('C', $weekIndex) . '4', "S{$weekIndex}");
                        }
                    }
                    $col = $this->advanceColumn($col, 4);
                }
                $sheet->getStyle('D4:BC4')->getFont()->setBold(true);

                // --- Aplicar Estilos y Formato Condicional ---
                $dataRowCount = count($this->data);
                if ($dataRowCount > 0) {
                    for ($row = 5; $row < $dataRowCount + 5; $row++) {
                        for ($colIndex = 3; $colIndex < 52 + 3; $colIndex++) {
                            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex + 1);
                            $cellValue = $sheet->getCell($colLetter . $row)->getValue();

                            if (array_key_exists($cellValue, $statusColors)) {
                                $sheet->getStyle($colLetter . $row)->getFill()
                                    ->setFillType(Fill::FILL_SOLID)
                                    ->getStartColor()->setARGB($statusColors[$cellValue]);
                                $sheet->getCell($colLetter . $row)->setValue(''); // Opcional: dejar solo el color
                            }
                        }
                    }
                }

                // Ajustar ancho de columnas
                $sheet->getColumnDimension('A')->setWidth(35);
                $sheet->getColumnDimension('B')->setWidth(35);
                $sheet->getColumnDimension('C')->setWidth(15);
                for ($i = 4; $i <= 55; $i++) {
                    $sheet->getColumnDimension(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i))->setWidth(5);
                }
            },
        ];
    }

    private function advanceColumn($col, $steps)
    {
        for ($i = 0; $i < $steps; $i++) $col++;
        return $col;
    }
}
