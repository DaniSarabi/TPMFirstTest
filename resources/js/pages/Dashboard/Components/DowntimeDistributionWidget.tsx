import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertCircle, PieChart } from 'lucide-react';

// Reutilizamos los colores para consistencia visual
const CATEGORY_STYLES: Record<string, string> = {
  Corrective: 'bg-red-500 dark:bg-red-600',
  Preventive: 'bg-blue-500 dark:bg-blue-600',
  'Awaiting Parts': 'bg-amber-400 dark:bg-amber-500',
  'Awaiting Quote': 'bg-orange-400 dark:bg-orange-500',
  'Awaiting Purchase': 'bg-orange-600 dark:bg-orange-700',
  'Awaiting Delivery': 'bg-amber-600 dark:bg-amber-700',
  'Awaiting External Vendor': 'bg-purple-500 dark:bg-purple-600',
  Other: 'bg-zinc-500 dark:bg-zinc-600',
  Operational: 'bg-emerald-500',
};

interface ParetoItem {
  category: string;
  total_minutes: number;
  count: number;
}

interface DowntimeDistributionWidgetProps {
  data: ParetoItem[];
  className?: string;
}

export function DowntimeDistributionWidget({ data, className }: DowntimeDistributionWidgetProps) {
  // 1. Cálculos Totales
  const totalDowntimeMinutes = data.reduce((acc, item) => acc + item.total_minutes, 0);

  // Función auxiliar para formato de tiempo (ej: 2h 15m)
  function formatDuration(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60); // truncado

    return `${hours}h ${minutes}m`;
  }

  return (
    <Card className={cn('flex h-full flex-col border bg-background border-zinc-200 shadow-sm drop-shadow-lg dark:border-zinc-800', className)}>
      <CardHeader className="border-b border-zinc-100 pb-3 dark:border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-zinc-500" />
            <CardTitle className="text-base font-bold text-zinc-700 dark:text-zinc-200">Downtime Distribution (Month)</CardTitle>
          </div>
          <div className="font-mono text-xs font-medium text-zinc-500">Total: {formatDuration(totalDowntimeMinutes)}</div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          {data.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-sm text-zinc-400">
              <AlertCircle className="mb-2 h-8 w-8 opacity-20" />
              No downtime recorded this month.
            </div>
          ) : (
            data.map((item) => {
              const percentage = totalDowntimeMinutes > 0 ? (item.total_minutes / totalDowntimeMinutes) * 100 : 0;

              const barColor = CATEGORY_STYLES[item.category] || 'bg-zinc-500';

              return (
                <div key={item.category} className="group">
                  {/* Label Row */}
                  <div className="mb-1.5 flex items-end justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{item.category}</span>
                      <span className="text-[10px] text-zinc-400">{item.count} occurrences</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatDuration(item.total_minutes)}</span>
                      <span className="ml-2 text-xs text-zinc-400">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>

                  {/* Progress Bar Background */}
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    {/* Colored Fill */}
                    <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${percentage}%` }} />
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
