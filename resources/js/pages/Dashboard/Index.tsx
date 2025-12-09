import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { CalendarRange, CheckCircle2, Clock, Inbox } from 'lucide-react';
import { AiFeedWidget } from './Components/AiFeedWidget';
import { DowntimeDistributionWidget } from './Components/DowntimeDistributionWidget';
import { FailureParetoWidget } from './Components/FailureParetoWidget';
import { FleetTimelineWidget } from './Components/FleetTimelineWidget';
import { AlertContent, KpiCard, MetricContent, ProgressContent } from './Components/KpiCard';
import { PartsTrackerWidget } from './Components/PartsTrackerWidget';
import { ReliabilityTrendWidget } from './Components/ReliabilityTrendWidget';
import { TicketAgingWidget } from './Components/TicketAgingWidget';
import { InspectionComplianceWidget } from './Components/TicketComplianceWidget';
import { TicketStatusDurationWidget } from './Components/TicketStatusDurationWidget';

interface DowntimeLog {
  id: number;
  machine_id: number;
  category: 'Corrective' | 'Preventive' | 'Awaiting Parts' | 'Other';
  start_time: string;
  end_time: string | null;
}
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
];
interface DashboardProps {
  metrics: {
    incomingTickets: { current: number; previous: number };
    resolvedTickets: { current: number; previous: number };
    activeBacklog: number;
    pmProgress: { current: any; previous: any };
  };
  machineTimelines: any;
  downtimePareto: any;

  aiInsights: any;
  resolutionTrend: any;
  failurePareto: any;
  partsTracker: any;
  statusDurations: any;
  ticketAging: any;
  inspectionCompliance: any;
}

export default function Dashboard({
  metrics,
  machineTimelines,
  downtimePareto,
  aiInsights,
  resolutionTrend,
  failurePareto,
  partsTracker,
  statusDurations,
  ticketAging,
  inspectionCompliance,
}: DashboardProps) {
  console.log(resolutionTrend);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="space-y-6 p-4">
        {/* Fila 1 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="New Tickets"
            icon={<Inbox className="h-7 w-7" />}
            iconColorClass="text-blue-600 bg-blue-50"
            className="bg-primary text-primary-foreground"
          >
            <MetricContent current={metrics.incomingTickets.current} previous={metrics.incomingTickets.previous} invertTrend={true} />
          </KpiCard>

          {/* CARD 2: Resolved Tickets */}
          <KpiCard
            title="Resolved Tickets"
            icon={<CheckCircle2 className="h-7 w-7" />}
            iconColorClass="text-emerald-600 bg-emerald-100"
            className="bg-[#014a93] text-primary-foreground"
          >
            <MetricContent current={metrics.resolvedTickets.current} previous={metrics.resolvedTickets.previous} invertTrend={false} />
          </KpiCard>

          {/* CARD 3: Active Backlog (Shake Animation) */}
          <KpiCard
            title="Pending / Backlog"
            icon={<Clock className="h-7 w-7" />}
            iconColorClass="text-amber-600 bg-amber-100"
            shouldAlert={metrics.activeBacklog > 0}
          >
            <AlertContent value={metrics.activeBacklog} label="Need attention" />
          </KpiCard>

          {/* CARD 4: PM Progress */}
          <KpiCard title="Preventive Maintenance" icon={<CalendarRange className="h-7 w-7" />} iconColorClass="text-indigo-600 bg-indigo-50">
            <ProgressContent current={metrics.pmProgress.current} previous={metrics.pmProgress.previous} />
          </KpiCard>
        </div>
        {/* Fila 2 */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* WIDGET 1: Fleet Timeline (Ocupa 2 columnas) */}
          <div className="h-[400px] lg:col-span-2">
            {/* Altura fija para permitir scroll interno */}
            <FleetTimelineWidget machines={machineTimelines} />
          </div>
          <div className="h-[400px] lg:col-span-1">
            <DowntimeDistributionWidget data={downtimePareto} />
          </div>
          <div className="h-[400px] lg:col-span-2">
            <AiFeedWidget insights={aiInsights} className="border shadow-lg shadow-indigo-800 drop-shadow-lg" />
          </div>
        </div>
        {/* --- FILA 3:  --- */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="w-full">
            <ReliabilityTrendWidget data={resolutionTrend} className="h-full border bg-background shadow-sm drop-shadow-lg dark:border-zinc-800" />
          </div>

          <div className="">
            <FailureParetoWidget data={failurePareto} className="h-full border bg-background shadow-sm drop-shadow-lg" />
          </div>
          <div className="">
            <PartsTrackerWidget data={partsTracker} className="h-full border bg-background shadow-sm drop-shadow-lg" />
          </div>
        </div>
        {/* FILA 4 */}
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="w-full lg:col-span-2">
            <TicketStatusDurationWidget
              data={statusDurations}
              className="h-full gap-4 border bg-background shadow-sm drop-shadow-lg dark:border-zinc-800"
            />
          </div>
          <div className="w-full lg:col-span-2">
            <TicketAgingWidget data={ticketAging} className="h-full gap-0 border bg-background shadow-sm drop-shadow-lg dark:border-zinc-800" />
          </div>
          {/* <div className="w-full rounded-xl border-2 lg:col-span-3">
            <InspectionComplianceWidget
              data={inspectionCompliance}
              className="h-full gap-0 border bg-background shadow-sm drop-shadow-lg dark:border-zinc-800"
            />
          </div> */}

        </div>
      </div>
    </AppLayout>
  );
}
