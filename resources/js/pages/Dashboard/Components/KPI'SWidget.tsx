import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Clock, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import * as React from 'react';

// --- Type Definitions ---
interface Snapshot {
  date: string;
  completion_percentage: number;
  completed_tasks: number;
  total_tasks: number;
}

interface MetricData {
  current: number;
  previous: number;
}

interface CombinedMetricsProps {
  // Weekly metrics
  ticketsOpened: MetricData;
  ticketsClosed: MetricData;
  awaitingParts: number;
  // Monthly progress
  currentSnapshot?: Snapshot;
  previousSnapshot?: Snapshot;
  isLoading: boolean;
}

type TrendDirection = 'up' | 'down' | 'stable';

function calculateTrend(current: number, previous: number, higherIsBetter: boolean): { direction: TrendDirection; diff: number } {
  const diff = current - previous;

  if (diff === 0) return { direction: 'stable', diff };

  const isPositive = diff > 0;
  const isBetter = higherIsBetter ? isPositive : !isPositive;

  return {
    direction: isBetter ? 'up' : 'down',
    diff: Math.abs(diff),
  };
}

interface MetricCardProps {
  value: number;
  label: string;
  current: number;
  previous: number;
  higherIsBetter: boolean;
  icon: React.ReactNode;
  bgColor: string;
  iconBgColor: string;
  progressValue?: number;
}

function MetricCard({ value, label, current, previous, higherIsBetter, icon, bgColor, iconBgColor, progressValue }: MetricCardProps) {
  const { direction, diff } = calculateTrend(current, previous, higherIsBetter);

  const getTrendColor = () => {
    if (direction === 'stable') return 'text-muted-foreground';
    return direction === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = () => {
    if (direction === 'stable') return <Minus className="h-3.5 w-3.5" />;
    return direction === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />;
  };

  const getDiffText = () => {
    if (direction === 'stable') return 'No change';
    const sign = direction === 'up' ? '+' : '-';
    return `${sign}${diff} from last week`;
  };

  return (
    <div className={`flex flex-1 flex-col rounded-xl border-0 p-6 transition-all hover:shadow-sm ${bgColor}`}>
      {/* Header with icon */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold  text-foreground/70">{label}</h3>
        <div className={`rounded-lg p-2.5 ${iconBgColor}`}>{icon}</div>
      </div>

      {/* Main value */}
      <div className="mb-4">
        <div className="text-4xl font-bold tracking-tight">{value}</div>
      </div>

      {/* Progress bar (if applicable) */}
      {progressValue !== undefined && (
        <div className="mb-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-emerald-300 to-emerald-700 transition-all duration-300"
              style={{ width: `${Math.min(progressValue, 100)}%` }}
            />
          </div>
          <div className="mt-1.5 text-xs text-muted-foreground">{progressValue.toFixed(1)}% complete</div>
        </div>
      )}

      {/* Trend */}
      <div className={`flex items-center gap-1.5 text-xs font-medium ${getTrendColor()}`}>
        {getTrendIcon()}
        <span>{getDiffText()}</span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex gap-4">
      <Skeleton className="h-56 flex-1 rounded-xl" />
      <Skeleton className="h-56 flex-1 rounded-xl" />
      <Skeleton className="h-56 flex-1 rounded-xl" />
      <Skeleton className="h-56 flex-1 rounded-xl" />
    </div>
  );
}

export function CombinedMetricsWidget({
  ticketsOpened,
  ticketsClosed,
  awaitingParts,
  currentSnapshot,
  previousSnapshot,
  isLoading,
}: CombinedMetricsProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const currentPercentage = currentSnapshot ? parseFloat(currentSnapshot.completion_percentage) : 0;

  return (
    <div className="flex gap-4">
      {/* Tickets Opened */}
      <MetricCard
        value={ticketsOpened.current}
        label="Tickets Opened"
        current={ticketsOpened.current}
        previous={ticketsOpened.previous}
        higherIsBetter={false}
        icon={<AlertCircle className="h-5 w-5" />}
        bgColor="bg-gradient-to-br from-blue-50 to-blue-500/50 dark:from-blue-950/20 dark:to-blue-500/10"
        iconBgColor="bg-blue-100/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
      />

      {/* Tickets Closed */}
      <MetricCard
        value={ticketsClosed.current}
        label="Tickets Closed"
        current={ticketsClosed.current}
        previous={ticketsClosed.previous}
        higherIsBetter={true}
        icon={<CheckCircle2 className="h-5 w-5" />}
        bgColor="bg-gradient-to-br from-green-50 to-green-500/50 dark:from-green-950/20 dark:to-green-500/10"
        iconBgColor="bg-green-100/80 text-green-600 dark:bg-green-900/40 dark:text-green-300"
      />

      {/* Awaiting Parts */}
      <MetricCard
        value={awaitingParts}
        label="Awaiting Parts"
        current={awaitingParts}
        previous={0}
        higherIsBetter={false}
        icon={<Clock className="h-5 w-5" />}
        bgColor="bg-gradient-to-br from-amber-50 to-amber-500/50 dark:from-amber-950/20 dark:to-amber-500/10"
        iconBgColor="bg-amber-100/80 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300"
      />

      {/* Monthly Progress */}
      {currentSnapshot && (
        <MetricCard
          value={currentPercentage}
          label="Monthly Progress"
          current={currentPercentage}
          previous={previousSnapshot ? parseFloat(previousSnapshot.completion_percentage) : currentPercentage}
          higherIsBetter={true}
          icon={<TrendingUp className="h-5 w-5" />}
          bgColor="bg-gradient-to-br from-emerald-50 to-emerald-500/50 dark:from-emerald-950/20 dark:to-emerald-500/10"
          iconBgColor="bg-emerald-100/80 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"
          progressValue={currentPercentage}
        />
      )}
    </div>
  );
}
