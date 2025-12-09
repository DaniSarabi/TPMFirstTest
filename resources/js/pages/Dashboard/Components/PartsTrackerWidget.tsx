import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Wrench } from 'lucide-react';
import { useState } from 'react';

interface PartItem {
  name: string;
  count: number;
  machines: string[];
}

interface PartsTrackerWidgetProps {
  // Ahora recibimos el objeto con las 3 llaves
  data: {
    '1M': PartItem[];
    '6M': PartItem[];
    YTD: PartItem[];
  };
  className?: string;
}

export function PartsTrackerWidget({ data, className }: PartsTrackerWidgetProps) {
  const [timeRange, setTimeRange] = useState<'1M' | '6M' | 'YTD'>('6M');

  // Selección segura de datos
  const currentData = data?.[timeRange] || [];

  // Calculamos el total para sacar porcentajes relativos
  const maxCount = Math.max(...currentData.map((d) => d.count), 1);

  return (
    <Card className={className}>
      <CardHeader className="flex shrink-0 flex-col gap-3 border-b border-zinc-100 pb-2 dark:border-zinc-800/50">
        {/* FILA SUPERIOR: Título */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base font-bold text-zinc-700 dark:text-zinc-200">Top Parts Used</CardTitle>
          </div>
          <div className="justify-end">
            <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="w-full sm:w-auto">
              <TabsList className="grid h-6 w-full grid-cols-3 bg-zinc-100 p-0.5 sm:w-[150px] dark:bg-zinc-800">
                <TabsTrigger value="1M" className="h-5 px-1 text-[9px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  1M
                </TabsTrigger>
                <TabsTrigger value="6M" className="h-5 px-1 text-[9px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  6M
                </TabsTrigger>
                <TabsTrigger value="YTD" className="h-5 px-1 text-[9px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  YTD
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardContent className="scrollbar-thin scrollbar-thumb-zinc-200 flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {currentData.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-sm text-zinc-400">
              <Package className="mb-2 h-8 w-8 opacity-20" />
              No parts usage detected in this period.
            </div>
          ) : (
            currentData.map((item, index) => {
              const percentage = (item.count / maxCount) * 100;
              const machinesToShow = item.machines.slice(0, 2); // Mostrar max 2 nombres
              const extraCount = item.machines.length - 2;

              return (
                <div key={index} className="group">
                  {/* Header Row: Nombre y Count */}
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-3 shrink-0 font-mono text-[9px] text-zinc-300">{String(index + 1).padStart(2, '0')}</span>
                      <span className="truncate text-xs font-semibold text-zinc-700 dark:text-zinc-200" title={item.name}>
                        {item.name}
                      </span>
                      <div className="flex flex-wrap gap-1 pl-1">
                        {machinesToShow.map((machineName, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="max-w-[100px] truncate border-0 bg-primary px-1 text-[8px] font-normal text-primary-foreground"
                          >
                            {machineName}
                          </Badge>
                        ))}
                        {extraCount > 0 && (
                          <Badge variant="outline" className="border-dashed border-zinc-200 bg-transparent px-1 text-[8px] font-normal text-zinc-400">
                            +{extraCount} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                        {item.count}
                      </span>
                    </div>
                  </div>


                  {/* Barra de Progreso */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-50 dark:bg-zinc-800/50">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500 group-hover:bg-amber-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
