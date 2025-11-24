import { CardTitle } from '@/components/ui/card';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Machine } from '@/types/machine';
import { ScheduledMaintenance } from '@/types/maintenance';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { DowntimeClockWidget } from './DowntimeClock';
import { CombinedMetricsWidget } from "./KPI'SWidget";
import { MonthlyMaintenanceTracker } from './MonthlyMaintenanceTracker';
import { PerformanceTrendsData, PerformanceTrendsWidget } from './PerformanceTrendWidget';

interface Snapshot {
  date: string;
  completion_percentage: number;
  completed_tasks: number;
  total_tasks: number;
}

interface TrendData {
  current?: Snapshot;
  previous?: Snapshot;
}

interface TrendsApiResponse {
  all: PerformanceTrendsData;
  critical: PerformanceTrendsData;
}

interface DowntimeLog {
  id: number;
  machine_id: number;
  category: 'Corrective' | 'Preventive' | 'Awaiting Parts' | 'Other';
  start_time: string;
  end_time: string | null;
}
interface WeekGlanceData {
  ticketsOpened: { current: number; previous: number };
  ticketsClosed: { current: number; previous: number };
  closureRate: { current: number; previous: number };
  awaitingParts: number;
}

// Define the props that this component receives from the main Dashboard page
interface LiveTabContentProps {
  machines: Machine[];
  scheduledMaintenances: ScheduledMaintenance[];
  todayDowntimeLogs: DowntimeLog[]; // Add this
}

const LiveTabContent = ({ machines, scheduledMaintenances, todayDowntimeLogs }: LiveTabContentProps) => {
  const [trendData, setTrendData] = React.useState<TrendData>({});
  const [isLoadingTrend, setIsLoadingTrend] = React.useState(true);
  const [trendsData, setTrendsData] = useState<TrendsApiResponse>({
    all: { uptime: [], mtbf: [], mttr: [] },
    critical: { uptime: [], mtbf: [], mttr: [] },
  });
  const [isLoadingTrends, setIsLoadingTrends] = React.useState(true);
  const [showCriticalOnly, setShowCriticalOnly] = React.useState(false);

  useEffect(() => {
    axios
      .get(route('dashboard.progress-trend'))
      .then((response) => setTrendData(response.data))
      .finally(() => setIsLoadingTrend(false));

    axios
      .get(route('dashboard.performance-trends'))
      .then((response) => setTrendsData(response.data))
      .finally(() => setIsLoadingTrends(false));
  }, []);

  const [weekGlanceData, setWeekGlanceData] = useState<WeekGlanceData>({
    ticketsOpened: { current: 0, previous: 0 },
    ticketsClosed: { current: 0, previous: 0 },
    closureRate: { current: 0, previous: 0 },
    awaitingParts: 0,
  });

  const [isLoadingWeekGlance, setIsLoadingWeekGlance] = useState(true);

  useEffect(() => {
    setIsLoadingWeekGlance(true);
    axios
      .get(route('dashboard.this-week-glance'))
      .then((response) => setWeekGlanceData(response.data))
      .finally(() => setIsLoadingWeekGlance(false));
  }, []);

  return (
    <div className="grid h-full grid-cols-5 grid-rows-[auto_auto_auto_auto] gap-4">
      {/* --- Area 1 --- */}

      {/* --- Area 2 --- */}
      <div className="col-span-4 row-span-1">
        <CombinedMetricsWidget
          ticketsOpened={weekGlanceData.ticketsOpened}
          closureRate={weekGlanceData.ticketsClosed}
          awaitingParts={weekGlanceData.awaitingParts}
          currentSnapshot={trendData.current}
          previousSnapshot={trendData.previous}
          isLoading={isLoadingWeekGlance || isLoadingTrend}
        />
      </div>

      {/* --- Clock --- */}
      <div className="col-span-1 col-start-5 row-span-2 row-start-1">
        <DowntimeClockWidget machines={machines} downtimeLogs={todayDowntimeLogs} />
      </div>

      {/* --- Performance Trends --- */}
      <div className="col-span-2 col-start-1 row-span-2 row-start-2">
          <PerformanceTrendsWidget
            isLoading={isLoadingTrends}
            trendsData={showCriticalOnly ? trendsData.critical : trendsData.all}
            showCriticalOnly={showCriticalOnly}
            setShowCriticalOnly={setShowCriticalOnly}
          />
      </div>

      {/* --- Monthly Maintenance Tracker --- */}
      <div className="col-span-2 col-start-3 row-span-1 row-start-2">
      
        {/* <MonthlyMaintenanceTracker machines={machines} scheduledMaintenances={scheduledMaintenances} /> */}
      </div>

      {/* --- Widget Block 1 (3 cells) --- */}
      {/* <div className="relative col-span-3 col-start-3 row-span-1 row-start-3 rounded-xl border border-dashed">
        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10" />
        <div className="p-4">
          <CardTitle>Future Widget Area 1</CardTitle>
        </div>
      </div> */}

      {/* --- Widget Block 2 (5 cells) --- */}
      {/* <div className="relative col-span-5 col-start-1 row-span-1 row-start-4 rounded-xl border border-dashed">
        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10" />
        <div className="p-4">
          <CardTitle>Future Widget Area 2</CardTitle>
        </div>
      </div> */}
    </div>
  );
};

export default LiveTabContent;
