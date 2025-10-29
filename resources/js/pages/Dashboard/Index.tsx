import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Machine } from '@/types/machine';
import { ScheduledMaintenance } from '@/types/maintenance';
import { Head } from '@inertiajs/react';
import AnalyticsTabContent from './Components/AnalyticsTabContent';
import LiveTabContent from './Components/LiveTabContent';

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
  machines: Machine[];
  scheduledMaintenances: ScheduledMaintenance[];
  todayDowntimeLogs: DowntimeLog[]; // Add this
}

export default function Dashboard({ machines, scheduledMaintenances, todayDowntimeLogs }: DashboardProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className=" rounded-b-2xl flex h-full flex-1 flex-col gap-4 p-4">
        <Tabs defaultValue="live_status" className="w-full">
          {/* Las "píldoras" para seleccionar la vista */}
          {/* <TabsList className="grid grid-cols-2">
            <TabsTrigger value="live_status">Live Status</TabsTrigger>
            <TabsTrigger value="analytics">Analytics & Trends</TabsTrigger>
          </TabsList> */}

          {/* Contenido de la Pestaña 1: Live Status */}
          <TabsContent value="live_status" className="mt-0">
            <LiveTabContent
              machines={machines}
              scheduledMaintenances={scheduledMaintenances}
              todayDowntimeLogs={todayDowntimeLogs} // Pass it down
            />
          </TabsContent>

          {/* Contenido de la Pestaña 2: Analytics & Trends */}
          <TabsContent value="analytics" className="mt-0">
            <AnalyticsTabContent />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
