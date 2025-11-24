import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ParetoPoint {
  name: string;
  full_name: string;
  count: number;
  cumulative: number;
}

interface ParetoDataSet {
  ai: ParetoPoint[];
  tech: ParetoPoint[];
}

interface FailureParetoWidgetProps {
  // Recibimos el objeto con las 3 llaves de tiempo
  data: {
    '1M': ParetoDataSet;
    '6M': ParetoDataSet;
    YTD: ParetoDataSet;
  };
  className?: string;
}

export function FailureParetoWidget({ data, className }: FailureParetoWidgetProps) {
  const [mode, setMode] = useState<'ai' | 'tech'>('ai');
  // Estado para el rango de tiempo (Default 1M)
  const [timeRange, setTimeRange] = useState<'1M' | '6M' | 'YTD'>('6M');

  // Selección de datos en 2 pasos: Tiempo -> Fuente (AI/Tech)
  // Usamos encadenamiento opcional (?.) por seguridad si alguna llave falta
  const currentDataSet = data?.[timeRange] || { ai: [], tech: [] };
  const chartData = mode === 'ai' ? currentDataSet.ai : currentDataSet.tech;

  const hasData = chartData.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="flex shrink-0 flex-col gap-3 border-b border-zinc-100 pb-2 dark:border-zinc-800/50">
        {/* FILA SUPERIOR: Título y Switch Fuente */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            <CardTitle className="text-base font-bold text-zinc-700 dark:text-zinc-200">Failure Categories</CardTitle>
          </div>

          <div className="w-[130px]">
            <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="w-full sm:w-auto">
              <TabsList className="grid h-6 w-full grid-cols-2 bg-zinc-100 p-0.5 sm:w-[130px] dark:bg-zinc-800">
                <TabsTrigger value="ai" className="h-5 px-1 text-[9px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  AI
                </TabsTrigger>
                <TabsTrigger value="tech" className="h-5 px-1 text-[9px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Tech
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* FILA INFERIOR: Tabs de Tiempo */}
        <div className="flex w-full justify-end">
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
      </CardHeader>

      <CardContent className="min-h-0 w-full flex-1 p-4">
        <div className="h-[300px] w-full">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#f5f5f5" vertical={false} />

                <XAxis dataKey="name" scale="band" tick={{ fontSize: 10, fill: '#71717a' }} interval={0} angle={-25} textAnchor="end" height={60} />

                <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 10, fill: '#71717a' }} width={30} />

                <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: '#f97316' }} width={35} />

                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) return payload[0].payload.full_name;
                    return label;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '0px' }} />

                <Bar yAxisId="left" dataKey="count" name="Frequency" barSize={30} radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={mode === 'ai' ? '#6366f1' : '#3b82f6'} />
                  ))}
                </Bar>

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative %"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#f97316', strokeWidth: 1, stroke: '#fff' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-sm text-zinc-400">
              <AlertCircle className="mb-2 h-8 w-8 opacity-20" />
              No failure data available for this period.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
