import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Clock, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import * as React from 'react';

// ====================================================================
// --- 1. Tipos Compartidos ---
// ====================================================================

interface Snapshot {
  date: string;
  completion_percentage: number | string;
  completed_tasks: number;
  total_tasks: number;
}

interface MetricData {
  current: number;
  previous: number;
}

type TrendDirection = 'up' | 'down' | 'stable';

// ====================================================================
// --- 2. Funciones de Utilidad Compartidas ---
// ====================================================================

/**
 * Calcula la tendencia entre dos valores, indicando si "más alto es mejor".
 */
function calculateTrend(current: number, previous: number, higherIsBetter: boolean): { direction: TrendDirection; diff: number } {
  const diff = current - previous;

  if (Math.abs(diff) < 0.1) return { direction: 'stable', diff: 0 };

  const isPositive = diff > 0;
  const isBetter = higherIsBetter ? isPositive : !isPositive;

  return {
    direction: isBetter ? 'up' : 'down',
    diff: diff,
  };
}

/**
 * Genera el texto descriptivo para una tendencia.
 */
function getTrendText(
  trend: { direction: TrendDirection; diff: number },
  higherIsBetter: boolean, // <-- ¡AQUÍ ESTÁ LA CORRECCIÓN!
  unit = '',
): string {
  if (trend.direction === 'stable') return 'No change';

  const sign = trend.diff > 0 ? '+' : '';
  // Usamos higherIsBetter para decidir los decimales (true para % usa 1, false para tickets usa 0)
  const diffText = `${sign}${trend.diff.toFixed(higherIsBetter ? 1 : 0)}${unit}`;

  if (trend.direction === 'up') return `${diffText} (Improving)`;
  return `${diffText} (Declining)`;
}

/**
 * Obtiene el icono de tendencia correspondiente.
 */
function getTrendIcon(trend: { direction: TrendDirection }): React.ReactNode {
  if (trend.direction === 'stable') return <Minus className="h-3.5 w-3.5" />;
  return trend.direction === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />;
}

/**
 * Obtiene el color de la tendencia.
 */
function getTrendColor(trend: { direction: TrendDirection }): string {
  if (trend.direction === 'stable') return 'text-muted-foreground';
  return trend.direction === 'up' ? 'text-green-600' : 'text-red-600';
}

// ====================================================================
// --- 3. Componentes de Tarjeta Individuales ---
// ====================================================================

// --- Tarjeta de Métrica (Tickets, Tasa de Cierre) ---

interface MetricCardProps {
  value: string;
  label: string;
  trend: { direction: TrendDirection; diff: number };
  higherIsBetter: boolean;
  icon: React.ReactNode;
  bgColor: string;
  iconBgColor: string;
  diffUnit?: string;
}

function MetricCard({ value, label, trend, higherIsBetter, icon, bgColor, iconBgColor, diffUnit = '' }: MetricCardProps) {
  const trendColor = getTrendColor(trend);
  const trendIcon = getTrendIcon(trend);
  // ¡AQUÍ SE PASA AHORA!
  const trendText = getTrendText(trend, higherIsBetter, diffUnit);

  return (
    <div className={`flex flex-1 flex-col rounded-xl border-0 p-6 transition-all hover:shadow-sm ${bgColor}`}>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground/70">{label}</h3>
        <div className={`rounded-lg p-2.5 ${iconBgColor}`}>{icon}</div>
      </div>
      <div className="mb-4">
        <div className="text-4xl font-bold tracking-tight">{value}</div>
      </div>
      <div className={`flex items-center gap-1.5 text-xs font-medium ${trendColor}`}>
        {trendIcon}
        <span>{trendText}</span>
      </div>
    </div>
  );
}

// --- Tarjeta de Estado (En Espera) ---

interface StatusCardProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  iconBgColor: string;
}

function StatusCard({ value, label, icon, bgColor, iconBgColor }: StatusCardProps) {
  const getStatusColor = () => {
    if (value === 0) return 'text-green-600';
    if (value < 5) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className={`flex flex-1 flex-col rounded-xl border-0 p-6 transition-all hover:shadow-sm ${bgColor}`}>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground/70">{label}</h3>
        <div className={`rounded-lg p-2.5 ${iconBgColor}`}>{icon}</div>
      </div>
      <div className="mb-4">
        <div className={`text-4xl font-bold tracking-tight ${getStatusColor()}`}>{value}</div>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Minus className="h-3.5 w-3.5" />
        <span>Currently on hold</span>
      </div>
    </div>
  );
}

// --- Tarjeta de Progreso (Progreso Mensual) ---

interface PerformanceProgressWidgetProps {
  currentSnapshot?: Snapshot;
  previousSnapshot?: Snapshot;
}

function PerformanceProgressWidget({ currentSnapshot, previousSnapshot }: PerformanceProgressWidgetProps) {
  const bgColor = 'bg-gradient-to-br from-zinc-50 to-zinc-500/50 dark:from-zinc-950/20 dark:to-zinc-500/10';

  // --- Estado Sin Datos ---
  if (!currentSnapshot) {
    return (
      <div
        className={`flex h-56 flex-1 flex-col items-center justify-center rounded-xl border-0 p-6 text-center transition-all hover:shadow-sm ${bgColor}`}
      >
        <div>
          <h3 className="text-lg font-bold text-foreground/70">Monthly Progress</h3>
        </div>
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">No progress data logged for today yet.</p>
        </div>
      </div>
    );
  }

  // --- Estado "N/A" ---
  if (currentSnapshot.total_tasks === 0) {
    return (
      <div className={`flex h-56 flex-1 flex-col rounded-xl border-0 p-6 transition-all hover:shadow-sm ${bgColor}`}>
        <div className="mb-6">
          <h3 className="text-lg font-bold text-foreground/70">Monthly Progress</h3>
          <p className="-mt-0.5 text-xs text-muted-foreground">vs. same day last month</p>
        </div>
        <div className="mb-4">
          <div className="text-4xl font-bold text-muted-foreground">N/A</div>
          <p className="-mt-1 text-sm font-medium text-muted-foreground">(0 tasks scheduled)</p>
        </div>
        <div className="w-full space-y-1">
          <Progress value={0} className="h-2" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Minus className="h-3.5 w-3.5" />
            <span>No maintenance scheduled.</span>
          </div>
        </div>
      </div>
    );
  }

  // --- Estado Normal (con datos) ---
  const currentPercentage = parseFloat(String(currentSnapshot.completion_percentage));

  let trend: { direction: TrendDirection; diff: number } | null = null;
  if (previousSnapshot) {
    const previousPercentage = parseFloat(String(previousSnapshot.completion_percentage));
    trend = calculateTrend(currentPercentage, previousPercentage, true);
  }

  const trendColor = trend ? getTrendColor(trend) : 'text-muted-foreground';
  const trendIcon = trend ? getTrendIcon(trend) : <Minus className="h-3.5 w-3.5" />;
  // ¡Y AQUÍ SE PASA 'true' PORQUE PARA PROGRESO, MÁS ALTO ES MEJOR!
  const trendText = trend ? getTrendText(trend, true, '%') : 'No data last month';

  return (
    <div className={`flex h-56 flex-1 flex-col rounded-xl border-0 p-6 transition-all hover:shadow-sm ${bgColor}`}>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground/70">Monthly Progress</h3>
        <p className="-mt-0.5 text-xs text-muted-foreground">vs. same day last month</p>
      </div>
      <div className="mb-4">
        <div className="text-4xl font-bold" style={{ color: '#8fa464' }}>
          {currentPercentage.toFixed(1)}%
        </div>
        <p className="-mt-1 text-sm font-medium text-muted-foreground">
          ({currentSnapshot.completed_tasks} of {currentSnapshot.total_tasks} tasks)
        </p>
      </div>
      <div className="w-full space-y-1">
        <Progress value={currentPercentage} className="h-2" />
        <div className={`flex items-center gap-1.5 text-xs font-medium ${trendColor}`}>
          {trendIcon}
          <span>{trendText}</span>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// --- 4. Componente Contenedor Principal ---
// ====================================================================

interface CombinedMetricsProps {
  ticketsOpened: MetricData;
  closureRate: MetricData;
  awaitingParts: number;
  currentSnapshot?: Snapshot;
  previousSnapshot?: Snapshot;
  isLoading: boolean;
}

/**
 * Widget principal que combina todas las métricas de KPI.
 */
export function CombinedMetricsWidget({
  ticketsOpened,
  closureRate,
  awaitingParts,
  currentSnapshot,
  previousSnapshot,
  isLoading,
}: CombinedMetricsProps) {
  const openTrend = calculateTrend(ticketsOpened.current, ticketsOpened.previous, false);
  const rateTrend = calculateTrend(closureRate.current, closureRate.previous, true);

  return (
    <div className="flex gap-4">
      {/* Tickets Opened */}
      <MetricCard
        value={ticketsOpened.current.toString()}
        label="New Tickets"
        trend={openTrend}
        higherIsBetter={false}
        diffUnit=""
        icon={<AlertCircle className="h-5 w-5" />}
        bgColor="bg-gradient-to-br from-blue-50 to-blue-500/50 dark:from-blue-950/20 dark:to-blue-500/10"
        iconBgColor="bg-blue-100/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
      />

      {/* Closure Rate */}
      <MetricCard
        value={`${closureRate.current.toFixed(0)}%`}
        label="Closure Rate"
        trend={rateTrend}
        higherIsBetter={true}
        diffUnit="%"
        icon={<CheckCircle2 className="h-5 w-5" />}
        bgColor="bg-gradient-to-br from-green-50 to-green-500/50 dark:from-green-950/20 dark:to-green-500/10"
        iconBgColor="bg-green-100/80 text-green-600 dark:bg-green-900/40 dark:text-green-300"
      />

      {/* Awaiting Parts */}
      <StatusCard
        value={awaitingParts}
        label="On Hold / Awaiting"
        icon={<Clock className="h-5 w-5" />}
        bgColor="bg-gradient-to-br from-amber-50 to-amber-500/50 dark:from-amber-950/20 dark:to-amber-500/10"
        iconBgColor="bg-amber-100/80 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300"
      />

      {/* Monthly Progress */}
      <PerformanceProgressWidget currentSnapshot={currentSnapshot} previousSnapshot={previousSnapshot} />
    </div>
  );
}
