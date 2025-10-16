import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import * as React from 'react';

// --- Type Definitions ---
interface Snapshot {
  date: string;
  completion_percentage: number;
  completed_tasks: number;
  total_tasks: number;
}

interface PerformanceTrendWidgetProps {
  currentSnapshot?: Snapshot;
  previousSnapshot?: Snapshot;
  isLoading: boolean;
}

export function PerformanceProgressWidget({ currentSnapshot, previousSnapshot, isLoading }: PerformanceTrendWidgetProps) {
  const trendData = React.useMemo(() => {
    if (!currentSnapshot || !previousSnapshot) {
      return { trend: 'stable', difference: 0 };
    }
    // FIX: Parse string values to numbers for calculation
    const currentPercent = parseFloat(currentSnapshot.completion_percentage);
    const previousPercent = parseFloat(previousSnapshot.completion_percentage);

    const difference = currentPercent - previousPercent;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (difference > 1) trend = 'up';
    if (difference < -1) trend = 'down';

    return { trend, difference };
  }, [currentSnapshot, previousSnapshot]);

  // --- FIX: Handle loading state ---
  if (isLoading) {
    return <Skeleton className="h-full w-full" />;
  }

  // --- FIX: Handle empty state when data has loaded but is empty ---
  if (!currentSnapshot) {
    return (
      <Card className="flex h-full flex-col items-center justify-center p-0 text-center">
        <CardHeader>
          <CardTitle>Monthly Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No progress data logged for today yet. The daily command might not have run.</p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = trendData.trend === 'up' ? TrendingUp : trendData.trend === 'down' ? TrendingDown : Minus;
  const trendColor = trendData.trend === 'up' ? 'text-green-600' : trendData.trend === 'down' ? 'text-red-600' : 'text-muted-foreground';
  const currentPercentage = parseFloat(currentSnapshot.completion_percentage);

  return (
    <Card className="flex h-auto py-7 flex-col border-0 bg-background shadow-none gap-0 ">
      <CardContent className=" flex flex-1 flex-col items-center justify-center ">
        <div className="text-5xl font-bold" style={{ color: '#8fa464' }}>
          {/* FIX: Use the parsed number */}
          {currentPercentage.toFixed(1)}%
        </div>
        {previousSnapshot && (
          <div className={`flex items-center gap-1 font-semibold ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span>
              {trendData.difference > 0 ? '+' : ''}
              {trendData.difference.toFixed(1)}% vs. last month
            </span>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {currentSnapshot.completed_tasks} of {currentSnapshot.total_tasks} tasks completed this month so far.
        </p>
      </CardContent>
    </Card>
  );
}
