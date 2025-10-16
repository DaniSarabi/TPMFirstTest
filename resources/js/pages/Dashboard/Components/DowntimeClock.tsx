import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Machine } from '@/types/machine';
import { differenceInMinutes, format, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';
import { HelpCircle, Pin, PinOff } from 'lucide-react';
import * as React from 'react';

interface DowntimeLog {
  id: number;
  machine_id: number;
  category: 'Corrective' | 'Preventive' | 'Awaiting Parts' | 'Other';
  start_time: string;
  end_time: string | null;
}

type ArcCategory = DowntimeLog['category'] | 'Operational';

interface DowntimeClockWidgetProps {
  machines: Machine[];
  downtimeLogs: DowntimeLog[];
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number): string => {
  if (endAngle - startAngle >= 359.99) {
    endAngle = startAngle + 359.99;
  }

  const startPoint = polarToCartesian(x, y, radius, startAngle);
  const endPoint = polarToCartesian(x, y, radius, endAngle);

  if (!isFinite(startPoint.x) || !isFinite(startPoint.y) || !isFinite(endPoint.x) || !isFinite(endPoint.y)) {
    return '';
  }

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    'M',
    startPoint.x.toFixed(3),
    startPoint.y.toFixed(3),
    'A',
    radius.toFixed(3),
    radius.toFixed(3),
    0,
    largeArcFlag,
    1,
    endPoint.x.toFixed(3),
    endPoint.y.toFixed(3),
  ].join(' ');
};

const formatDuration = (totalMinutes: number): string => {
  if (totalMinutes < 1) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const COLORS = {
  Corrective: '#a4193d',
  Preventive: '#4b648d',
  'Awaiting Parts': '#eab308',
  Other: '#6b7280',
  Operational: '#8fa464',
};

const CATEGORY_ORDER: ArcCategory[] = ['Operational', 'Corrective', 'Preventive', 'Awaiting Parts', 'Other'];

export function DowntimeClockWidget({ machines, downtimeLogs }: DowntimeClockWidgetProps) {
  const [isPinned, setIsPinned] = React.useState(false);
  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const [hoveredArcIndex, setHoveredArcIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!isPinned && machines.length > 1) {
      const timer = setInterval(() => {
        setCarouselIndex((prevIndex) => (prevIndex + 1) % machines.length);
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [isPinned, machines.length]);

  const timelineData = React.useMemo(() => {
    const machineToShow = machines[carouselIndex];

    if (!machineToShow) {
      return { arcs: [], uptimePercentage: 100, downtimeTotals: {}, totalDowntime: 0 };
    }

    const now = new Date();
    const startOfToday = startOfDay(now);

    const filteredLogs = downtimeLogs.filter((log) => log.machine_id === machineToShow.id);

    const totalMinutesInDay = 1440;

    const timePoints = new Set<number>();
    timePoints.add(startOfToday.getTime());
    timePoints.add(now.getTime());

    for (const log of filteredLogs) {
      const start = new Date(log.start_time).getTime();
      const end = log.end_time ? new Date(log.end_time).getTime() : now.getTime();
      if (start >= startOfToday.getTime() && start < now.getTime()) timePoints.add(start);
      if (end > startOfToday.getTime() && end <= now.getTime()) timePoints.add(end);
    }
    const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);

    const segments: { start: Date; end: Date; category: ArcCategory; duration: number }[] = [];
    for (let i = 0; i < sortedTimePoints.length - 1; i++) {
      const segmentStart = new Date(sortedTimePoints[i]);
      const segmentEnd = new Date(sortedTimePoints[i + 1]);
      if (segmentStart.getTime() === segmentEnd.getTime()) continue;
      const segmentMidpoint = new Date((segmentStart.getTime() + segmentEnd.getTime()) / 2);

      let category: ArcCategory = 'Operational';
      const causingLog = filteredLogs.find((log) => {
        const logStart = new Date(log.start_time);
        const logEnd = log.end_time ? new Date(log.end_time) : now;
        return segmentMidpoint >= logStart && segmentMidpoint < logEnd;
      });
      if (causingLog) category = causingLog.category;

      segments.push({ start: segmentStart, end: segmentEnd, category, duration: differenceInMinutes(segmentEnd, segmentStart) });
    }

    const arcs: typeof segments = [];
    if (segments.length > 0) {
      let currentArc = { ...segments[0] };
      for (let i = 1; i < segments.length; i++) {
        if (segments[i].category === currentArc.category && segments[i].start.getTime() === currentArc.end.getTime()) {
          currentArc.end = segments[i].end;
          currentArc.duration += segments[i].duration;
        } else {
          arcs.push(currentArc);
          currentArc = { ...segments[i] };
        }
      }
      arcs.push(currentArc);
    }

    const totalDowntimeMinutes = arcs.filter((arc) => arc.category !== 'Operational').reduce((sum, arc) => sum + arc.duration, 0);
    const elapsedMinutes = differenceInMinutes(now, startOfToday);
    const uptimePercentage = elapsedMinutes > 0 ? Math.round(((elapsedMinutes - totalDowntimeMinutes) / elapsedMinutes) * 100) : 100;

    const downtimeTotals = arcs.reduce(
      (acc, arc) => {
        acc[arc.category] = (acc[arc.category] || 0) + arc.duration;
        return acc;
      },
      {} as Record<string, number>,
    );

    return { arcs, uptimePercentage, downtimeTotals, totalDowntime: totalDowntimeMinutes, startOfToday };
  }, [carouselIndex, machines, downtimeLogs]);

  const currentMachine = machines[carouselIndex];

  return (
    <Card className="flex h-full flex-col border-0 bg-background p-1 shadow-none gap-1">
      <CardHeader className="space-y-0 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="line-clamp-1">{currentMachine?.name || 'No Machine'}</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[250px]">
                  <p className="text-sm">24-hour clock showing machine uptime and downtime categories for today. Auto-cycles through all machines.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsPinned(!isPinned)} className="shrink-0">
            {isPinned ? <Pin className="h-4 w-4 fill-current" /> : <PinOff className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center p-0">
        <TooltipProvider>
          <svg viewBox="0 0 240 240" className="h-full max-h-[280px] w-full">
            {/* Center text */}
            <text x="120" y="110" textAnchor="middle" fontSize="36" fontWeight="bold" fill={COLORS['Operational']}>
              {timelineData.uptimePercentage}%
            </text>
            <text x="120" y="128" textAnchor="middle" fontSize="10" fill="hsl(240, 5%, 65%)">
              Uptime
            </text>
            <text x="120" y="142" textAnchor="middle" fontSize="9" fontWeight="600" fill="hsl(240, 5%, 45%)">
              {formatDuration(timelineData.totalDowntime)} downtime
            </text>

            {/* 24-hour markers (0, 6, 12, 18) */}
            {[
              { angle: 0, label: '0' },
              { angle: 90, label: '6' },
              { angle: 180, label: '12' },
              { angle: 270, label: '18' },
            ].map(({ angle, label }) => {
              const pos = polarToCartesian(120, 120, 105, angle);
              return (
                <text key={angle} x={pos.x} y={pos.y + 3} textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(240, 5%, 25%)">
                  {label}
                </text>
              );
            })}

            {/* Arcs */}
            {timelineData.arcs.map((arc, i) => {
              const totalMinutesInDay = 1440;
              if (arc.duration <= 0) return null;
              const startOffset = differenceInMinutes(arc.start, timelineData.startOfToday);
              const startAngle = (startOffset / totalMinutesInDay) * 360;
              const endAngle = ((startOffset + arc.duration) / totalMinutesInDay) * 360;

              const gapAngle = 0.5;
              const adjustedStartAngle = startAngle + gapAngle;
              const adjustedEndAngle = endAngle - gapAngle;

              if (adjustedEndAngle <= adjustedStartAngle) return null;

              return (
                <Tooltip key={`arc-${i}`}>
                  <TooltipTrigger asChild>
                    <motion.g>
                      <path
                        d={describeArc(120, 120, 85, adjustedStartAngle, adjustedEndAngle)}
                        stroke="transparent"
                        strokeWidth="30"
                        fill="none"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredArcIndex(i)}
                        onMouseLeave={() => setHoveredArcIndex(null)}
                      />
                      <path
                        d={describeArc(120, 120, hoveredArcIndex === i ? 90 : 85, adjustedStartAngle, adjustedEndAngle)}
                        stroke={COLORS[arc.category as keyof typeof COLORS]}
                        strokeWidth="22"
                        fill="none"
                        style={{ pointerEvents: 'none', transition: 'all 0.2s ease-out' }}
                      />
                    </motion.g>
                  </TooltipTrigger>
                  <TooltipContent className="">
                    <div className="font-semibold">{arc.category}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDuration(arc.duration)}
                      <br />
                      {format(arc.start, 'HH:mm')} - {format(arc.end, 'HH:mm')}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </svg>
        </TooltipProvider>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="grid w-full grid-cols-2 gap-2 text-xs">
          {CATEGORY_ORDER.map((category) => {
            const duration = timelineData.downtimeTotals[category] || 0;
            const elapsedMinutes = differenceInMinutes(new Date(), timelineData.startOfToday);
            const percentage = elapsedMinutes > 0 ? ((duration / elapsedMinutes) * 100).toFixed(1) : '0.0';

            return (
              <div key={category} className="flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[category as keyof typeof COLORS] }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="truncate text-xs font-medium">{category}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{percentage}%</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{formatDuration(duration)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardFooter>
    </Card>
  );
}
