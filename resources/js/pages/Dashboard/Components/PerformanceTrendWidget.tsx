import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

interface TrendData {
  date: string;
  value: number;
}

export interface PerformanceTrendsData {
  uptime: TrendData[];
  mtbf: TrendData[];
  mttr: TrendData[];
}

interface PerformanceTrendsWidgetProps {
  isLoading: boolean;
  trendsData: PerformanceTrendsData;
  showCriticalOnly: boolean;
  setShowCriticalOnly: (value: boolean) => void;
}

type MetricConfig = {
  title: string;
  description: string;
  color: string;
  unit: string;
  higherIsBetter: boolean;
};

const METRICS: Record<'uptime' | 'mtbf' | 'mttr', MetricConfig> = {
  uptime: {
    title: 'Uptime',
    description: '30-day average operational time',
    color: '#8fa464',
    unit: '%',
    higherIsBetter: true,
  },
  mtbf: {
    title: 'MTBF',
    description: 'Mean time between failures',
    color: '#4b648d',
    unit: '',
    higherIsBetter: true,
  },
  mttr: {
    title: 'MTTR',
    description: 'Mean time to repair',
    color: '#a4193d',
    unit: '',
    higherIsBetter: false,
  },
};

function MetricCard({ metricKey, data, config }: { metricKey: string; data: TrendData[]; config: MetricConfig }) {
  const calculateTrend = (): { direction: 'up' | 'down' | 'stable'; percentChange: number; previousValue: number } => {
    if (data.length < 2) return { direction: 'stable', percentChange: 0, previousValue: 0 };
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;
    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(percentChange) >= 3) {
      direction = percentChange > 0 ? 'up' : 'down';
    }

    return { direction, percentChange, previousValue: firstAvg };
  };

  const trendData = calculateTrend();
  const currentValue = data.length > 0 ? data[data.length - 1].value : 0;

  // Determine unit based on value (for MTBF/MTTR)
  const getDisplayUnit = () => {
    if (config.unit) return config.unit; // Uptime always uses %
    return currentValue >= 1 ? 'd' : 'h'; // Days if >= 1, otherwise hours
  };

  const formatValue = (value: number) => {
    const unit = getDisplayUnit();
    if (config.unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    if (unit === 'd') {
      return `${value.toFixed(1)}d`;
    }
    return `${value.toFixed(1)}h`;
  };

  const formatChartValue = (value: number) => {
    if (config.unit === '%') {
      return `${Number(value).toFixed(1)}%`;
    }
    return Number(value) >= 1 ? `${Number(value).toFixed(1)}d` : `${Number(value).toFixed(1)}h`;
  };

  const getTrendDisplay = () => {
    const { direction, percentChange, previousValue } = trendData;

    if (direction === 'stable') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-help items-center gap-1 text-muted-foreground">
                <Minus className="h-3 w-3" />
                <span className="text-xs">Stable</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Change: {percentChange >= 0 ? '+' : ''}
                {percentChange.toFixed(1)}%
                <br />
                Previous: {formatValue(previousValue)}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    const isGood = (direction === 'up' && config.higherIsBetter) || (direction === 'down' && !config.higherIsBetter);
    const color = isGood ? 'text-green-600' : 'text-red-600';
    const Icon = direction === 'up' ? ArrowUp : ArrowDown;
    const label = isGood ? 'Improving' : 'Declining';

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex cursor-help items-center gap-1 ${color}`}>
              <Icon className="h-3 w-3" />
              <span className="text-xs font-medium">{label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              Change: {percentChange >= 0 ? '+' : ''}
              {percentChange.toFixed(1)}%
              <br />
              Previous: {formatValue(previousValue)}
              <br />
              Current: {formatValue(currentValue)}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const chartConfig = {
    value: {
      label: config.title,
      color: config.color,
    },
  };

  return (
    <div className="flex-1 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold">{config.title}</h4>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
        {getTrendDisplay()}
      </div>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-bold text-primary">{formatValue(currentValue)}</span>
        <div className="flex-1">
          <ChartContainer config={chartConfig} className="h-[100px] w-full">
            <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
              <defs>
                <linearGradient id={`gradient-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.2} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      try {
                        // Value is the date string from data
                        const date = new Date(value as string);
                        if (isNaN(date.getTime())) {
                          return String(value);
                        }
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      } catch {
                        return String(value);
                      }
                    }}
                    formatter={(value) => [formatChartValue(Number(value)), config.title]}
                  />
                }
              />
              <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={2} fill={`url(#gradient-${metricKey})`} fillOpacity={1} />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="border-0 bg-card shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-40" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="h-px bg-border" />
        <Skeleton className="h-20 w-full" />
        <div className="h-px bg-border" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

export function PerformanceTrendsWidget({ isLoading, trendsData, showCriticalOnly, setShowCriticalOnly }: PerformanceTrendsWidgetProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <Card className="border-0 bg-background shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Last 30 days facility-wide</CardDescription>
          </div>
          <div className="flex gap-1 rounded-lg border bg-muted p-1">
            <Button variant={showCriticalOnly ? 'default' : 'ghost'} size="sm" className="h-7 px-3 text-xs" onClick={() => setShowCriticalOnly(true)}>
              Critical
            </Button>
            <Button
              variant={!showCriticalOnly ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setShowCriticalOnly(false)}
            >
              All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MetricCard metricKey="uptime" data={trendsData.uptime} config={METRICS.uptime} />
        <div className="h-px bg-border" />
        <MetricCard metricKey="mtbf" data={trendsData.mtbf} config={METRICS.mtbf} />
        <div className="h-px bg-border" />
        <MetricCard metricKey="mttr" data={trendsData.mttr} config={METRICS.mttr} />
      </CardContent>
    </Card>
  );
}
