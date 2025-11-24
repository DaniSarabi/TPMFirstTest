import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { differenceInMinutes, endOfDay, format, startOfDay } from 'date-fns';
import { Info } from 'lucide-react';

// ====================================================================
// 1. CONFIGURACIÓN DE COLORES COMPLETA
// ====================================================================

const CATEGORY_STYLES: Record<string, string> = {
  Operational: 'bg-emerald-500 dark:bg-emerald-600',
  Corrective: 'bg-red-500 dark:bg-red-600',
  Preventive: 'bg-blue-500 dark:bg-blue-600',
  Other: 'bg-zinc-500 dark:bg-zinc-600',

  // Grupo Awaiting
  'Awaiting Parts': 'bg-amber-400 dark:bg-amber-500',
  'Awaiting Quote': 'bg-orange-400 dark:bg-orange-500',
  'Awaiting Purchase': 'bg-orange-600 dark:bg-orange-700',
  'Awaiting Delivery': 'bg-amber-600 dark:bg-amber-700',
  'Awaiting External Vendor': 'bg-purple-500 dark:bg-purple-600',
};

// Orden específico para la leyenda (para que se vea ordenado)
const LEGEND_ORDER = [
  'Operational',
  'Corrective',
  'Preventive',
  'Awaiting Parts',
  'Awaiting Quote',
  'Awaiting Purchase',
  'Awaiting Delivery',
  'Awaiting External Vendor',
  'Other',
];

interface DowntimeLog {
  id: number;
  category: string;
  start_time: string;
  end_time: string | null;
}

interface MachineTimeline {
  id: number;
  name: string;
  current_status: string;
  active_log_start: string | null;
  downtime_logs: DowntimeLog[];
}

interface FleetTimelineWidgetProps {
  machines: MachineTimeline[];
  className?: string;
}

// ====================================================================
// 2. COMPONENTE PRINCIPAL
// ====================================================================

export function FleetTimelineWidget({ machines, className }: FleetTimelineWidgetProps) {
  const now = new Date();
  const dayStart = startOfDay(now);
  const totalMinutesInDay = 1440;

  // Calculamos porcentaje de "Ahora" para cortar la barra verde
  const currentMinutes = differenceInMinutes(now, dayStart);
  const currentTimePercent = Math.min((currentMinutes / totalMinutesInDay) * 100, 100);

  return (
    <Card className={cn('flex h-full flex-col border drop-shadow-lg bg-background gap-2 border-zinc-200 shadow-sm dark:border-zinc-800', className)}>
      <CardHeader className="space-y-3 border-b border-zinc-100  dark:border-zinc-800/50">
        <CardTitle className="text-base font-bold text-zinc-700 dark:text-zinc-200">Fleet Status Timeline (Today)</CardTitle>

        {/* LEYENDA COMPLETA Y RESPONSIVA */}
        <div className=" flex flex-wrap gap-x-4 gap-y-0">
          {LEGEND_ORDER.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', CATEGORY_STYLES[cat])}></span>
              <span className="text-[10px] font-medium whitespace-nowrap text-zinc-500">{cat}</span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {machines.map((machine) => (
            <div key={machine.id} className="px-4 py-1 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-900/30">
              {/* Header de Máquina */}
              <div className=" flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIndicator status={machine.current_status} />
                  <span className="max-w-[150px] truncate text-sm font-semibold text-zinc-700 dark:text-zinc-200">{machine.name}</span>
                </div>
                <div className="font-mono text-xs text-zinc-400">{machine.current_status === 'Operational' ? 'Running' : machine.current_status}</div>
              </div>

              {/* BARRA DE TIMELINE */}
              {/* El fondo zinc-100 representa el futuro (después de "ahora") */}
              <div className="relative h-5 w-full overflow-hidden rounded-sm border border-zinc-200/50 bg-zinc-100 dark:border-zinc-700/50 dark:bg-zinc-800">
                {/* CAPA 1: BARRA VERDE BASE (De 00:00 a AHORA) */}
                {/* Asumimos que todo es operativo hasta que se demuestre lo contrario */}
                <div className={cn('absolute top-0 bottom-0 left-0', CATEGORY_STYLES['Operational'])} style={{ width: `${currentTimePercent}%` }} />

                {/* Grid de horas (Overlay visual) */}
                <div className="pointer-events-none absolute inset-0 z-10 flex justify-between px-[1px]">
                  {[0, 6, 12, 18].map((h) => (
                    <div
                      key={h}
                      className="h-full w-[1px] bg-white/30 dark:bg-black/20"
                      style={{ left: `${(h / 24) * 100}%`, position: 'absolute' }}
                    />
                  ))}
                </div>

                {/* CAPA 2: LOGS DE DOWNTIME (Se pintan ENCIMA del verde) */}
                <TooltipProvider delayDuration={0}>
                  {(machine.downtime_logs || []).map((log) => {
                    const logStart = new Date(log.start_time);
                    const logEnd = log.end_time ? new Date(log.end_time) : now;

                    // Clamping visual
                    const displayStart = logStart < dayStart ? dayStart : logStart;
                    const displayEnd = logEnd > endOfDay(now) ? endOfDay(now) : logEnd;

                    if (displayEnd <= displayStart) return null;

                    const startOffsetMinutes = differenceInMinutes(displayStart, dayStart);
                    const durationMinutes = differenceInMinutes(displayEnd, displayStart);

                    const leftPercent = (startOffsetMinutes / totalMinutesInDay) * 100;
                    const widthPercent = (durationMinutes / totalMinutesInDay) * 100;

                    // Fallback de color
                    const barColor = CATEGORY_STYLES[log.category] || 'bg-zinc-600';

                    return (
                      <Tooltip key={log.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'absolute top-0 z-20 h-full cursor-help border-r border-white/20 shadow-sm transition-all hover:brightness-110',
                              barColor,
                            )}
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="z-50 border-zinc-200 p-2 text-xs shadow-xl">
                          <div className="mb-0.5 flex items-center gap-2 font-bold">
                            <span className={cn('h-2 w-2 rounded-full', barColor)}></span>
                            {log.category}
                          </div>
                          <div className="">
                            {format(logStart, 'HH:mm')} - {log.end_time ? format(logEnd, 'HH:mm') : 'Now'}
                            <span className="ml-2 font-mono text-zinc-200">({durationMinutes}m)</span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>

                {/* Marcador de "Ahora" (Línea punteada roja) */}
                <div
                  className="pointer-events-none absolute top-0 bottom-0 z-30 w-[2px] border-l-2 border-dashed border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  style={{ left: `${currentTimePercent}%` }}
                />
              </div>

              <div className="mt-0.5 flex justify-between px-0.5 font-mono text-[9px]  ">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:59</span>
              </div>
            </div>
          ))}

          {machines.length === 0 && (
            <div className="p-8 text-center text-sm text-zinc-400">
              <Info className="mx-auto mb-2 h-8 w-8 opacity-50" />
              No machines found in fleet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusIndicator({ status }: { status: string }) {
  const colorClass = CATEGORY_STYLES[status] || 'bg-zinc-400';
  const isOperational = status === 'Operational';

  return (
    <span className="relative flex h-2.5 w-2.5">
      {!isOperational && <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', colorClass)}></span>}
      <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full shadow-sm', colorClass)}></span>
    </span>
  );
}
