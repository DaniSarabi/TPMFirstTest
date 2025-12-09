import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipContent, TooltipProvider, TooltipTrigger, Tooltip as UITooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AlertOctagon, AlertTriangle, CheckCircle2, Clock, HelpCircle, Timer } from 'lucide-react';
import { ResponsiveContainer, Tooltip, Treemap } from 'recharts';

interface AgingData {
  under_24h: number;
  '1_3_days': number;
  '3_7_days': number;
  over_7_days: number;
}

interface TicketAgingWidgetProps {
  data: AgingData;
  className?: string;
}

export function TicketAgingWidget({ data, className }: TicketAgingWidgetProps) {
  const total = data.under_24h + data['1_3_days'] + data['3_7_days'] + data.over_7_days;

  // Configuración de colores y metadatos
  const bucketsConfig = [
    {
      key: 'under_24h',
      label: '< 24h',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      borderColor: 'border-l-emerald-500 border-b-emerald-500',
      dotColor: 'bg-emerald-500', // Color explícito para la bolita del tooltip
      bgHover: 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20',
      desc: 'On Track',
    },
    {
      key: '1_3_days',
      label: '1-3 Days',
      icon: Timer,
      color: 'text-blue-600',
      borderColor: 'border-l-blue-500 border-b-blue-500',
      dotColor: 'bg-blue-500',
      bgHover: 'group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20',
      desc: 'Normal',
    },
    {
      key: '3_7_days',
      label: '3-7 Days',
      icon: AlertTriangle,
      color: 'text-amber-600',
      borderColor: 'border-l-amber-500 border-b-amber-500',
      dotColor: 'bg-amber-500',
      bgHover: 'group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20',
      desc: 'Warning',
    },
    {
      key: 'over_7_days',
      label: '+ 7 Days',
      icon: AlertOctagon,
      color: 'text-rose-600',
      borderColor: 'border-l-rose-500 border-b-rose-500',
      dotColor: 'bg-rose-500',
      bgHover: 'group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20',
      desc: 'Overdue',
    },
  ];

  // Preparamos la data para el Treemap
  const chartData = bucketsConfig.map((cfg) => {
    // @ts-ignore - Acceso dinámico a data
    const realCount = data[cfg.key];
    return {
      name: cfg.label,
      size: realCount === 0 ? 0.5 : realCount,
      realCount: realCount,
      ...cfg,
    };
  });

  // Componente que renderiza CADA BLOQUE del Treemap
  const CustomTreemapItem = (props: any) => {
    const { x, y, width, height, name } = props;
    const itemConfig = chartData.find((item) => item.name === name);
    if (!itemConfig) return null;

    const { icon: Icon, color, borderColor, bgHover, desc, realCount } = itemConfig;

    // Lógica de tamaños
    const isTiny = width < 40 || height < 40;
    const isVerticalLayout = height > 80;
    const isLargeLayout = height > 140;

    return (
      <foreignObject x={x} y={y} width={width} height={height} style={{ overflow: 'visible' }}>
        <div className="h-full w-full p-1 transition-all duration-500 ease-out">
          <div
            className={cn(
              'group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all hover:z-10 hover:scale-[1.02] hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900',
              'border-b-4 border-l-4',
              borderColor,
              bgHover,
            )}
          >
            {!isTiny && (
              <div className="flex h-full flex-col justify-between p-3 pl-4">
                <div className="flex items-start justify-between">
                  <span className="truncate text-[10px] font-bold tracking-wider text-zinc-400 uppercase">{name}</span>
                  <Icon className={cn('h-4 w-4 opacity-50', color)} />
                </div>

                <div className="relative z-10 mt-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    {/* CAMBIO: Texto más grande si hay espacio */}
                    <span
                      className={cn(
                        'leading-none font-black tracking-tight transition-transform group-hover:origin-left group-hover:scale-110',
                        color,
                        isLargeLayout ? 'text-5xl' : 'text-3xl',
                      )}
                    >
                      {realCount}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {total > 0 && (
                        // CAMBIO: Badge de porcentaje un poco más grande (text-xs)
                        <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs font-bold text-zinc-500 dark:bg-zinc-800">
                          {Math.round((realCount / total) * 100)}%
                        </span>
                      )}

                      {!isVerticalLayout && (
                        <>
                          <span className="text-[10px] text-zinc-300 dark:text-zinc-600">•</span>
                          <span className="max-w-[80px] truncate text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{desc}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {isVerticalLayout && (
                    <div
                      className={cn('mt-1 font-medium text-zinc-500 transition-all dark:text-zinc-400', isLargeLayout ? 'text-sm' : 'text-[10px]')}
                    >
                      {desc}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </foreignObject>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/50">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-purple-500" />
          <CardTitle className="text-base font-bold text-zinc-700 dark:text-zinc-200">Backlog Aging</CardTitle>

          {/* CAMBIO: Tooltip de ayuda en el título */}
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 cursor-help text-zinc-400 transition-colors hover:text-zinc-600" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-medium">Ticket Age Distribution</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Shows open tickets grouped by how long they have been active. Larger blocks represent more tickets.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <div className="rounded-full border border-zinc-200 px-2 py-0.5 text-sm font-medium text-zinc-400">Total: {total}</div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col p-4">
        <div className="h-full min-h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={chartData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="#fff"
              content={<CustomTreemapItem />}
              isAnimationActive={true}
              animationDuration={800}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-center gap-2">
                          {/* CAMBIO: Usamos dotColor explícito para la bolita */}
                          <div className={cn('h-2 w-2 rounded-full', data.dotColor)} />
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{data.name}</span>
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          Count: <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{data.realCount}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400">{data.desc}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
