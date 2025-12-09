import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Check, FileText, GraduationCap, Sparkles, ThumbsDown, ThumbsUp, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Insight {
  id: number;
  ticket_id: number;
  type: 'COACHING_OPPORTUNITY' | 'MACHINE_HEALTH_TIP' | 'RECURRENCE_ALERT' | 'GENERAL_INFO';
  content: string;
  created_at: string;
  status?: 'pending' | 'validated' | 'dismissed';
  machine?: { name: string };
  user?: { name: string };
  ticket?: {
    id: number;
    ai_analysis_json?: {
      ai_subcategory_1?: string; // <--- Aquí está el "Título" del problema
    };
  };
}

interface AiFeedWidgetProps {
  insights: Insight[];
  className?: string;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  COACHING_OPPORTUNITY: { icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Coaching' },
  MACHINE_HEALTH_TIP: { icon: Wrench, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Machine Health' },
  RECURRENCE_ALERT: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Recurrence' },
  GENERAL_INFO: { icon: Sparkles, color: 'text-indigo-600', bg: 'bg-zinc-50 dark:bg-indigo-800', label: 'Insight' },
};

export function AiFeedWidget({ insights, className }: AiFeedWidgetProps) {
  // 1. ESTADO LOCAL: Para manejar actualizaciones instantáneas sin recargar
  const [items, setItems] = useState<Insight[]>(insights);

  // Sincronizar si las props cambian (ej: paginación o recarga externa)
  useEffect(() => {
    setItems(insights);
  }, [insights]);

  // 2. LÓGICA DEL BADGE "NEW": Solo contamos los 'pending'
  const pendingCount = items.filter((i) => i.status === 'pending' || !i.status).length;

  // 3. FEEDBACK OPTIMISTA
  const handleFeedback = (insightId: number, newStatus: 'validated' | 'dismissed') => {
    // A. Actualización Visual Inmediata (Optimista)
    if (newStatus === 'dismissed') {
      // Si es dislike, lo quitamos de la lista visualmente
      setItems((current) => current.filter((i) => i.id !== insightId));
    } else {
      // Si es like (validated), cambiamos su estado para que reste del contador "New"
      setItems((current) => current.map((i) => (i.id === insightId ? { ...i, status: 'validated' } : i)));
    }

    // B. Llamada al Backend (En segundo plano)
    router.patch(
      route('ai-insights.status', insightId),
      { status: newStatus },
      {
        preserveScroll: true,
        onSuccess: () => {
          // Toast opcional aquí
          // console.log('Feedback guardado en BD');
        },
      },
    );
  };

  return (
    <div className={cn('group relative h-full w-full rounded-xl', className)}>
      <div className="absolute -inset-[5px] rounded-xl bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-50 blur-sm transition-all duration-1000 group-hover:via-indigo-500/60 group-hover:opacity-100" />

      <div className="absolute -inset-[1px] overflow-hidden rounded-xl">
        <div
          className="absolute inset-[-100%] animate-spin bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#6366f1_50%,#0000_100%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ animationDuration: '3s' }}
        />
      </div>

      <div className="absolute inset-0 rounded-xl border border-indigo-200/50 dark:border-indigo-900/50" />
      {/* 2. EL CONTENIDO (Sobrepuesto con fondo sólido) */}
      <Card className="relative flex h-full flex-col gap-0 overflow-hidden rounded-xl border-0 bg-white py-3 shadow-none dark:bg-zinc-950">
        <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-3 dark:border-zinc-800/50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Icono con efecto de pulso suave */}
              <div className="relative p-1">
                <div className="absolute inset-0 animate-pulse rounded-full bg-indigo-500 opacity-20 blur"></div>
                <Sparkles className="relative z-10 h-4 w-4 text-indigo-500" />
              </div>
              <CardTitle className="bg-gradient-to-r from-zinc-800 to-zinc-500 bg-clip-text text-base font-bold text-zinc-700 dark:from-zinc-100 dark:to-zinc-400 dark:text-zinc-200">
                Assistant Feed
              </CardTitle>
            </div>

            {pendingCount > 0 ? (
              <Badge
                variant="secondary"
                className="border-indigo-100 bg-indigo-50 px-1.5 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
              >
                {pendingCount} New
              </Badge>
            ) : (
              <Badge variant="outline" className="border-zinc-200 bg-transparent px-1.5 text-zinc-400">
                All caught up
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 flex-1 overflow-y-auto p-0">
          {items.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center p-4 text-center text-sm text-zinc-400">
              <div className="mb-3 rounded-full bg-zinc-100 p-3 dark:bg-zinc-900">
                <Check className="h-6 w-6 opacity-40" />
              </div>
              <p>System optimized.</p>
              <p className="mt-1 text-xs opacity-70">No actionable insights detected.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {items.map((item) => {
                const config = TYPE_CONFIG[item.type] || TYPE_CONFIG['GENERAL_INFO'];
                const Icon = config.icon;
                const technicalContext = item.ticket?.ai_analysis_json?.ai_subcategory_1 || 'System Note';

                // Estilo visual para items ya validados (un poco más apagados)
                const isValidated = item.status === 'validated';

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'group/item relative p-4 transition-colors',
                      isValidated ? 'bg-zinc-50/50 opacity-70 hover:opacity-100' : 'hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10',
                    )}
                  >
                    {/* Barra lateral: Azul si es pendiente, Verde si es validado */}
                    <div
                      className={cn(
                        'absolute top-0 bottom-0 left-0 w-[3px] transition-opacity',
                        isValidated
                          ? 'bg-emerald-500 opacity-100' // Validado se queda verde fijo
                          : cn('opacity-0 group-hover/item:opacity-100', config.bg.replace('bg-', 'bg-opacity-100 bg-')),
                      )}
                    />

                    <div className="flex items-start gap-3">
                      {/* Icono */}
                      <div className={cn('mt-1 shrink-0 rounded-lg p-2 shadow-sm', config.bg, config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Header: Label + Context */}
                        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-y-1">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-[10px] font-extrabold tracking-wider uppercase', config.color)}>{config.label}</span>
                            <span className="max-w-[120px] truncate rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
                              {technicalContext}
                            </span>
                          </div>
                          <span className="text-[10px] whitespace-nowrap text-zinc-400">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Contenido */}
                        <p className="mb-2.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">{item.content}</p>

                        {/* Footer Metadata */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {item.machine && (
                              <Badge
                                variant="outline"
                                className="h-5 border-zinc-200 bg-white px-1.5 text-[9px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                              >
                                {item.machine.name}
                              </Badge>
                            )}
                            {item.ticket && (
                              <Link
                                href={route('tickets.show', item.ticket.id)}
                                className="flex items-center gap-1 text-[9px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline dark:text-indigo-400"
                              >
                                <FileText className="h-3 w-3" />#{item.ticket.id}
                              </Link>
                            )}
                          </div>

                          {!isValidated ? (
                            <div className="flex items-center gap-1 opacity-40 transition-opacity group-hover/item:opacity-100">
                              <span className="mr-1 hidden text-[9px] text-zinc-600 group-hover/item:block">Useful?</span>
                              <button
                                onClick={() => handleFeedback(item.id, 'validated')}
                                className="rounded p-1 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                                title="Validar (Útil)"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleFeedback(item.id, 'dismissed')}
                                className="rounded p-1 transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Descartar (Ocultar)"
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[9px] font-medium text-emerald-600">
                              <Check className="h-3 w-3" /> Validated
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
