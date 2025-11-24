import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils'; // Asegúrate de tener una utilidad cn, si no, usa strings normales
import { AlertTriangle, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';

// ============================================================================
// 1. EL CONTENEDOR MAESTRO (KPI CARD)
// ============================================================================

interface KpiCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  iconColorClass?: string;
  shouldAlert?: boolean; // <--- NUEVA PROP PARA ACTIVAR EL TEMBLOR
}

export function KpiCard({ title, icon, children, className, iconColorClass = 'text-zinc-600 bg-zinc-100', shouldAlert = false }: KpiCardProps) {
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (!shouldAlert) {
      setShaking(false);
      return;
    }

    // Intervalo: Espera 4 segundos, tiembla 0.8s
    const interval = setInterval(() => {
      setShaking(true);
      setTimeout(() => setShaking(false), 800); // 0.8 segundos de temblor
    }, 4800);

    return () => clearInterval(interval);
  }, [shouldAlert]);

  return (
    <>
      {/* CSS INYECTADO LOCALMENTE PARA EL SHAKE */}
      <style>{`
        @keyframes card-shake {
          0%, 100% { transform: rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: rotate(-1deg); }
          20%, 40%, 60%, 80% { transform: rotate(1deg); }
        }
        .animate-card-shake {
          animation: card-shake 0.8s ease-in-out; /* Duración 0.8s */
        }
      `}</style>

      <div
        className={cn(
          'flex h-full flex-col justify-between rounded-xl drop-shadow-lg border bg-white p-6 shadow-sm transition-all dark:bg-zinc-800',
          // Si hay alerta, borde ambar y sombra ambar, si no, borde normal
          shouldAlert ? 'border-amber-300 shadow-amber-100 dark:border-amber-900/50' : 'border-zinc-200 hover:shadow-md dark:border-zinc-800',
          shaking ? 'animate-card-shake' : '', // Aplica la clase de animación a TODA la tarjeta
          className,
        )}
      >
        {/* HEADER */}
        <div className="mb-5 flex items-start justify-between">
          <h3 className="text-sm font-bold tracking-wider  uppercase ">{title}</h3>
          <div className={cn('rounded-lg p-2.5', iconColorClass)}>{icon}</div>
        </div>

        {/* BODY */}
        <div className="flex flex-1 flex-col justify-end">{children}</div>
      </div>
    </>
  );
}

// ============================================================================
// 2. VARIANTE A: MÉTRICA COMPARATIVA (Incoming / Resolved)
// ============================================================================

interface MetricContentProps {
  current: number;
  previous: number;
  invertTrend?: boolean;
}

export function MetricContent({ current, previous, invertTrend = false }: MetricContentProps) {
  const diff = current - previous;
  const isStable = diff === 0;
  const isUp = diff > 0;

  const isGood = invertTrend ? !isUp : isUp;

  const trendColor = isStable ? 'text-zinc-500' : isGood ? 'text-emerald-400' : 'text-red-300';

  const TrendIcon = isStable ? Minus : isUp ? ArrowUp : ArrowDown;

  return (
    <div>
      <div className="text-4xl font-bold tracking-tight ">{current}</div>

      <div className="mt-2 flex items-center gap-2 text-sm font-medium">
        <span className={cn('flex items-center gap-0.5', trendColor)}>
          <TrendIcon className="h-4 w-4" />
          <span>
            {diff > 0 ? '+' : ''}
            {diff}
          </span>
        </span>
        <span className="">vs last month</span>
      </div>
    </div>
  );
}

// ============================================================================
// 3. VARIANTE B: ALERTA / BACKLOG (Con animación Shake)
// ============================================================================

interface AlertContentProps {
  value: number;
  label?: string;
}

export function AlertContent({ value, label = 'Awaiting attention' }: AlertContentProps) {
  const isCritical = value > 0;

  // Este componente ya solo se encarga de pintar el texto y colores,
  // el movimiento lo maneja el padre.
  return (
    <div>
      <div className={cn('text-4xl font-bold tracking-tight', isCritical ? 'text-amber-600' : 'text-emerald-600')}>{value}</div>

      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-zinc-500">
        {isCritical ? (
          <div className="flex items-center gap-2 font-bold text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <span>{label}</span>
          </div>
        ) : (
          <span className="flex items-center gap-1 text-emerald-600">All clear</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 4. VARIANTE C: PROGRESO (PMs)
// ============================================================================

interface ProgressContentProps {
  current: { completed_tasks: number; total_tasks: number; completion_percentage: number } | null;
  previous: { completion_percentage: number } | null;
}

export function ProgressContent({ current, previous }: ProgressContentProps) {
  if (!current || current.total_tasks === 0) {
    return <div className="py-2 text-sm text-zinc-400 italic">No maintenance scheduled this month.</div>;
  }

  const pct = parseFloat(String(current.completion_percentage));
  const prevPct = previous ? parseFloat(String(previous.completion_percentage)) : 0;
  const diff = pct - prevPct;

  return (
    <div className="w-full">
      <div className="mb-3 flex items-end gap-2">
        <span className="text-4xl font-bold text-indigo-600">{pct.toFixed(0)}%</span>
        <span className="mb-1.5 text-sm font-medium text-zinc-500">
          ({current.completed_tasks}/{current.total_tasks} tasks)
        </span>
      </div>
      <Progress value={pct} className="h-3 bg-zinc-100" /> {/* Barra un poco más gruesa */}
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
        <span>Goal: 100%</span>
        {previous && (
          <span className={diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}>
            {diff > 0 ? '+' : ''}
            {diff.toFixed(0)}% vs last month
          </span>
        )}
      </div>
    </div>
  );
}
