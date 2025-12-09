import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CalendarCheck, Info } from 'lucide-react';

interface DailyStatus {
  date: string;
  weekday: string;
  full_date: string;
  status: 'completed' | 'missed' | 'na';
}

interface MachineCompliance {
  id: number;
  name: string;
  history: DailyStatus[];
}

interface InspectionComplianceWidgetProps {
  data: MachineCompliance[];
  className?: string;
}

const STATUS_CONFIG = {
  completed: { color: 'bg-emerald-500', label: 'Done', desc: 'Inspection completed' },
  missed: { color: 'bg-rose-500', label: 'Missed', desc: 'No inspection recorded' },
  na: { color: 'bg-zinc-100 dark:bg-zinc-800', label: 'N/A', desc: 'Machine setup / New' },
};

export function InspectionComplianceWidget({ data, className }: InspectionComplianceWidgetProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/50">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-indigo-500" />
          <CardTitle className="text-base font-bold text-zinc-700 dark:text-zinc-200">Inspection Habit (60 Days)</CardTitle>
        </div>

        {/* Leyenda Compacta */}
        <div className="flex gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={cn('h-2 w-2 rounded-sm', config.color)} />
              <span className="text-[10px] font-medium tracking-wide text-zinc-400 uppercase">{config.label}</span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 p-0">
        {data.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-sm text-zinc-400">
            <Info className="mb-2 h-8 w-8 opacity-20" />
            No machines configured.
          </div>
        ) : (
          // SCROLL CONTAINER: Clave para responsividad
          <div className="scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 h-full w-full overflow-x-auto">
            <div className="min-w-max p-4">
              {/* min-w-max asegura que los cuadritos no se aplasten */}
              <div className="flex flex-col gap-2">
                {data.map((machine) => (
                  <div key={machine.id} className="flex items-center gap-3">
                    {/* Nombre de Máquina (Sticky a la izquierda visualmente) */}
                    <div className="flex w-28 shrink-0 items-center justify-end">
                      <div className="truncate text-right text-[10px] font-semibold text-zinc-600 dark:text-zinc-300" title={machine.name}>
                        {machine.name}
                      </div>
                    </div>
                    {/* Heatmap Grid */}
                    <div className="flex gap-[2px]">
                      {/* Gap muy pequeño tipo GitHub */}
                      {machine.history.map((day, i) => {
                        const config = STATUS_CONFIG[day.status];
                        return (
                          <TooltipProvider key={i} delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    'h-2.5 w-2.5 cursor-help rounded-[1px] transition-all hover:z-10 hover:scale-125 hover:opacity-80',
                                    config.color,
                                  )}
                                />
                              </TooltipTrigger>
                              {/* TOOLTIP ESTILO "BLANQUITO" */}
                              <TooltipContent
                                className="rounded-lg border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
                                sideOffset={5}
                              >
                                <div className="mb-0.5 text-xs font-bold text-zinc-800 dark:text-zinc-100">
                                  {day.date} <span className="font-normal text-zinc-400">({day.weekday})</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
                                  <div className={cn('h-1.5 w-1.5 rounded-full', config.color)} />
                                  {config.desc}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
