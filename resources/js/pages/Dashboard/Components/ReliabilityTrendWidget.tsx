import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Clock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface TrendPoint {
  date: string;
  hours: number | null;
  count: number;
  full_date?: string;
}

interface ReliabilityTrendWidgetProps {
  // Ahora esperamos un objeto con dos arrays
  data: { daily: TrendPoint[]; monthly: TrendPoint[] };
  className?: string;
}

export function ReliabilityTrendWidget({ data, className }: ReliabilityTrendWidgetProps) {
  const [timeRange, setTimeRange] = useState('30D');

  // Convierte horas crudas (26.5) en texto legible (1d 2.5h)
  const formatDuration = (hours: number) => {
    if (hours === 0) return '0h';

    // Si es menos de 24h, mostramos solo horas (ej: 5.5h)
    if (hours < 24) return `${Math.round(hours * 10) / 10}h`;

    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);

    // Si no sobran horas exactas, solo mostramos días (ej: 3d)
    if (remainingHours === 0) return `${days}d`;

    return `${days}d ${remainingHours}h`;
  };

  // Formateador compacto para el Eje Y (por espacio limitado)
  const formatAxis = (hours: number) => {
    if (hours === 0) return '0';
    if (hours >= 24) return `${(hours / 24).toFixed(0)}d`; // Ej: "5d"
    return `${hours.toFixed(0)}h`; // Ej: "12h"
  };
  // Lógica de selección de datos
  const chartData = useMemo(() => {
    if (!data) return [];

    const daily = Array.isArray(data.daily) ? data.daily : [];
    const monthly = Array.isArray(data.monthly) ? data.monthly : [];

    // Helper para sanitizar: Si es null lo dejamos null, si es número lo usamos
    const clean = (arr: TrendPoint[]) => arr.map((i) => ({ ...i, hours: i.hours !== null ? Number(i.hours) : null }));

    switch (timeRange) {
      case '7D':
        // Últimos 7 días del array diario
        return clean(daily.slice(-7));
      case '30D':
        // Todo el array diario (30 días)
        return clean(daily);
      case '6M':
        // Últimos 6 meses del array mensual
        return clean(monthly.slice(-6));
      case '1Y':
        // Todo el array mensual (12 meses)
        return clean(monthly);
      default:
        return [];
    }
  }, [data, timeRange]);

  // Verificamos si hay al menos un dato válido en el rango seleccionado
  const hasData = chartData.some((item) => item.hours !== null && item.hours > 0);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800/50">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <CardTitle className="text-base font-bold text-zinc-700 dark:text-zinc-200">Avg. Resolution Time</CardTitle>
        </div>

        {/* TABS DE RANGO */}
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList className="h-7 bg-zinc-100 p-0.5 dark:bg-zinc-800">
            <TabsTrigger value="7D" className="h-6 px-2 text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              7D
            </TabsTrigger>
            <TabsTrigger value="30D" className="h-6 px-2 text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              30D
            </TabsTrigger>
            <TabsTrigger value="6M" className="h-6 px-2 text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              6M
            </TabsTrigger>
            <TabsTrigger value="1Y" className="h-6 px-2 text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              1Y
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 p-4">
        <div className="h-full min-h-[250px] w-full">
          {/* Renderizamos gráfica solo si hay datos, o mensaje vacío */}
          {/* Nota: Quitamos hasData check estricto para que muestre el eje aunque esté vacía si prefieres */}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />

              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} dy={10} minTickGap={20} />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#71717a' }}
                width={35}
                domain={[0, 'auto']}
                tickFormatter={formatAxis}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                formatter={(value: any) => [value !== null ? formatDuration(Number(value)) : 'No data', 'Avg Time']}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0] && payload[0].payload.full_date) {
                    return payload[0].payload.full_date;
                  }
                  return label;
                }}
              />

              <Area
                type="monotone"
                dataKey="hours"
                stroke="#3b82f6"
                fill="url(#colorHours)"
                strokeWidth={3}
                // Puntos solo donde hay dato real
                dot={(props: any) =>
                  props.payload.hours !== null ? <circle cx={props.cx} cy={props.cy} r={3} fill="#3b82f6" stroke="none" /> : <></>
                }
                activeDot={{ r: 5 }}
                isAnimationActive={false}
                connectNulls={true} // Conecta los puntos saltando los nulos
              />
            </AreaChart>
          </ResponsiveContainer>

          {!hasData && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-xs text-zinc-500 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
                <AlertCircle className="h-4 w-4" />
                No closed tickets in this range
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
