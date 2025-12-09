import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart as BarIcon, Hourglass, Info, PauseCircle, PieChart as PieIcon, PlayCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface StatusDuration {
  status: string;
  avg_hours: number;
  ticket_count: number;
}

interface TicketStatusDurationWidgetProps {
  data: StatusDuration[];
  className?: string;
}

// Paleta de colores para el Pie Chart
const COLORS = ['#6366f1', '#f97316', '#10b981', '#3b82f6', '#f43f5e', '#8b5cf6', '#64748b'];

export function TicketStatusDurationWidget({ data, className }: TicketStatusDurationWidgetProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const hasData = data && data.length > 0;

  // Calcular el total de horas para sacar porcentajes
  const totalAvgHours = data.reduce((acc, item) => acc + item.avg_hours, 0);

  // --- HELPER: FORMATO AMIGABLE DE TIEMPO ---
  const formatDuration = (hours: number) => {
    if (hours === 0) return '0h';

    // Si es menos de 24h, mostramos solo horas con 1 decimal (ej: 5.5h)
    if (hours < 24) return `${Math.round(hours * 10) / 10}h`;

    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);

    // Si no sobran horas exactas, solo mostramos días (ej: 3d)
    if (remainingHours === 0) return `${days}d`;

    return `${days}d ${remainingHours}h`;
  };

  // Lógica de Auto-Cambio
  useEffect(() => {
    if (!hasData || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setChartType((currentType) => (currentType === 'bar' ? 'pie' : 'bar'));
          return 0;
        }
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [hasData, isPaused]);

  const handleManualChange = (v: string) => {
    setChartType(v as 'bar' | 'pie');
    setProgress(0);
  };

  return (
    <Card className={className} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <CardHeader className="relative flex shrink-0 flex-row items-center justify-between overflow-hidden border-b border-zinc-100 pb-2 dark:border-zinc-800/50">
        <div className="flex items-center gap-2">
          {chartType === 'bar' ? <Hourglass className="h-4 w-4 text-indigo-500" /> : <PieIcon className="h-4 w-4 text-indigo-500" />}
          <CardTitle className="text-base font-bold text-zinc-700 dark:text-zinc-200">
            {chartType === 'bar' ? 'Avg. Time in Status' : 'Status Time Distribution'}
          </CardTitle>

          <div
            className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] transition-colors ${!isPaused ? 'border-indigo-100 bg-indigo-50 text-indigo-500' : 'border-zinc-200 bg-zinc-100 text-zinc-400'}`}
          >
            {!isPaused ? <PlayCircle className="h-2.5 w-2.5" /> : <PauseCircle className="h-2.5 w-2.5" />}
            {!isPaused ? 'Auto' : 'Paused'}
          </div>
        </div>

        <Tabs value={chartType} onValueChange={handleManualChange}>
          <TabsList className="h-7 bg-zinc-100 p-0.5 dark:bg-zinc-800">
            <TabsTrigger value="bar" className="h-6 gap-1.5 px-2 text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <BarIcon className="h-3 w-3" /> Hours
            </TabsTrigger>
            <TabsTrigger value="pie" className="h-6 gap-1.5 px-2 text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <PieIcon className="h-3 w-3" /> Share
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {hasData && (
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full bg-indigo-500 transition-all duration-100 ease-linear ${isPaused ? 'opacity-50' : 'opacity-100'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="min-h-0 w-full flex-1 p-4">
        <div className="h-[300px] w-full">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f4f4f5" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="status"
                    type="category"
                    width={100}
                    tick={{ fontSize: 11, fill: '#71717a', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    // USO DE LA NUEVA FUNCIÓN DE FORMATO
                    formatter={(value: number) => [formatDuration(value), 'Avg Duration']}
                  />
                  <Bar dataKey="avg_hours" barSize={20} radius={[0, 4, 4, 0]} background={{ fill: '#f4f4f5' }}>
                    {data.map((entry, index) => {
                      const color = index === 0 ? '#f97316' : '#6366f1';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={100} outerRadius={150} paddingAngle={2} dataKey="avg_hours" nameKey="status">
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    // USO DE LA NUEVA FUNCIÓN DE FORMATO EN PIE
                    formatter={(value: number, name: string) => {
                      const percent = totalAvgHours > 0 ? ((value / totalAvgHours) * 100).toFixed(1) : 0;
                      return [`${percent}% (${formatDuration(value)})`, name];
                    }}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-sm text-zinc-400">
              <Info className="mb-2 h-8 w-8 opacity-20" />
              No data available.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
