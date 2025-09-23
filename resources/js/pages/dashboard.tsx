import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MachineHealthChart } from '@/components/ui/MachineHealthChart';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Machine } from '@/types/machine';
import { Head, router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: route('dashboard'),
  },
];

interface DashboardProps {
  machines: Machine[];
  healthStats: any;
  filters?: {
    machine_id: number | null;
    period: 'today' | 'week' | 'month';
  };
}

export default function Dashboard({ machines = [], healthStats, filters = { machine_id: null, period: 'today' } }: DashboardProps) {
  const handleFilterChange = (key: 'machine_id' | 'period', value: string | number) => {
    router.get(
      route('dashboard'),
      {
        ...filters,
        [key]: value,
      },
      {
        preserveState: true,
        replace: true,
      },
    );
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        {/* --- SECCIÓN DE GRÁFICAS --- */}
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {/* Tarjeta de Gráfica de Salud (con controles integrados) */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Machine Health Overview</CardTitle>
              {/* ACTION: Se mueven los filtros dentro de la tarjeta */}
              <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
                <Select value={String(filters.machine_id)} onValueChange={(value) => handleFilterChange('machine_id', value)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select a machine..." />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((machine) => (
                      <SelectItem key={machine.id} value={String(machine.id)}>
                        {machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Tabs value={filters.period} onValueChange={(value) => handleFilterChange('period', value)} className="w-full sm:w-auto">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="week">This Week</TabsTrigger>
                    <TabsTrigger value="month">This Month</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 items-center justify-center">
              {healthStats ? (
                <MachineHealthChart stats={healthStats} period={(filters.period.charAt(0).toUpperCase() + filters.period.slice(1)) as any} />
              ) : (
                <div className="flex h-[300px] items-center justify-center rounded-lg bg-muted/50 p-4">
                  <p className="text-center text-muted-foreground">No inspection data available for this machine and period.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ACTION: Se mantienen los placeholders para futuras gráficas */}
          <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
          </div>
          
        </div>
      </div>
    </AppLayout>
  );
}
