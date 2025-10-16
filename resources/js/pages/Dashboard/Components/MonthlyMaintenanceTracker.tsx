import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Machine } from '@/types/machine';
import { MaintenanceReportResult, MaintenanceTemplateTask, ScheduledMaintenance } from '@/types/maintenance';
import { addMonths, format, isSameMonth, startOfMonth, subMonths } from 'date-fns';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, FileText, Minus, PlayCircle } from 'lucide-react';
import * as React from 'react';

interface MonthlyMaintenanceTrackerProps {
  machines: Machine[];
  scheduledMaintenances: (ScheduledMaintenance & {
    template?: { tasks: MaintenanceTemplateTask[] };
    report: { completed_at: string; results: MaintenanceReportResult[] } | null;
  })[];
}

type MachineStatus = 'completed' | 'in_progress' | 'scheduled' | 'overdue' | 'not_scheduled' | 'pending';

interface MachineMaintenanceStatus {
  machine: Machine;
  status: MachineStatus;
  scheduledDate?: string;
  completedAt?: string;
}

// Machine SVG Icons
const MachineIcons: Record<string, React.ReactNode> = {
  default: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-75">
      <rect x="2" y="4" width="20" height="14" rx="2" fill="currentColor" opacity="0.4" />
      <rect x="4" y="6" width="16" height="10" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="6" y="8" width="12" height="6" fill="currentColor" />
    </svg>
  ),
  stamping: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-75">
      <rect x="5" y="8" width="14" height="10" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="7" y="6" width="10" height="3" fill="currentColor" opacity="0.8" />
      <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <rect x="9" y="10" width="6" height="6" fill="currentColor" opacity="0.7" />
    </svg>
  ),
  winding: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-75">
      <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.3" />
      <circle cx="12" cy="12" r="5.5" fill="currentColor" opacity="0.5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="white" opacity="0.8" />
    </svg>
  ),
  oven: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-75">
      <rect x="3" y="4" width="18" height="16" rx="1.5" fill="currentColor" opacity="0.3" />
      <rect x="5" y="6" width="14" height="9" rx="1" fill="currentColor" opacity="0.6" />
      <circle cx="9" cy="17" r="1.2" fill="currentColor" opacity="0.8" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" opacity="0.8" />
      <circle cx="15" cy="17" r="1.2" fill="currentColor" opacity="0.8" />
    </svg>
  ),
  resin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-75">
      <path d="M6 4h12v12c0 3-2 5-6 5s-6-2-6-5V4z" fill="currentColor" opacity="0.4" />
      <path d="M8 6h8v10c0 2-1.5 3-4 3s-4-1-4-3V6z" fill="currentColor" opacity="0.7" />
      <ellipse cx="12" cy="6" rx="4" ry="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  ),
};

function getMachineIcon(machineName: string) {
  const name = machineName.toLowerCase();
  
  if (name.includes('stamping') || name.includes('press')) return MachineIcons.stamping;
  if (name.includes('winding') || name.includes('wind')) return MachineIcons.winding;
  if (name.includes('oven') || name.includes('curing')) return MachineIcons.oven;
  if (name.includes('huber') || name.includes('resin') || name.includes('cast')) return MachineIcons.resin;
  
  return MachineIcons.default;
}

const getStatusIcon = (status: MachineStatus) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'in_progress':
      return <PlayCircle className="h-4 w-4 animate-pulse text-blue-600" />;
    case 'scheduled':
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case 'overdue':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case 'not_scheduled':
      return <Minus className="h-4 w-4 text-gray-400" />;
    default:
      return null;
  }
};

const getStatusColor = (status: MachineStatus) => {
  switch (status) {
    case 'completed':
      return 'bg-gradient-to-br from-green-300 to-green-400 text-white';
    case 'in_progress':
      return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white';
    case 'scheduled':
      return 'bg-gradient-to-br from-amber-500 to-amber-600 text-white';
    case 'overdue':
      return 'bg-gradient-to-br from-red-500 to-red-600 text-white';
    case 'not_scheduled':
      return 'bg-gradient-to-br from-gray-500 to-gray-600 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const getStatusLabel = (status: MachineStatus) => {
  if (status === 'in_progress') return 'In Progress';
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
};

export function MonthlyMaintenanceTracker({ machines, scheduledMaintenances }: MonthlyMaintenanceTrackerProps) {
  const [selectedMonth, setSelectedMonth] = React.useState<Date>(startOfMonth(new Date()));
  const [isInfoPopoverOpen, setInfoPopoverOpen] = React.useState(false);
  const hoverTimer = React.useRef<NodeJS.Timeout | null>(null);

  const { currentMonthData } = React.useMemo(() => {
    const calculateMonthData = (month: Date) => {
      const maintenancesForMonth = scheduledMaintenances.filter(
        (sm) => isSameMonth(new Date(sm.scheduled_date), month) && sm.schedulable_type.includes('Machine'),
      );

      const machineStatuses: MachineMaintenanceStatus[] = machines.map((machine) => {
        const maintenances = scheduledMaintenances.filter(
          (sm) =>
            sm.schedulable_id === machine.id &&
            sm.schedulable_type.includes('Machine') &&
            isSameMonth(new Date(sm.scheduled_date), month),
        );

        if (maintenances.length === 0) {
          return { machine, status: 'not_scheduled' };
        }

        const statusPriority: MachineStatus[] = ['overdue', 'in_progress', 'scheduled', 'completed'];
        const mostUrgentStatus = maintenances
          .map((m) => {
            if (m.status.includes('completed')) return 'completed';
            if (m.status.includes('overdue')) return 'overdue';
            if (m.status.includes('in_progress')) return 'in_progress';
            return 'scheduled';
          })
          .sort((a, b) => statusPriority.indexOf(a) - statusPriority.indexOf(b))[0];

        return {
          machine,
          status: mostUrgentStatus,
          scheduledDate: maintenances[0].scheduled_date,
          completedAt: maintenances[0].report?.completed_at,
        };
      });

      return {
        machineStatuses,
        completed: machineStatuses.filter((m) => m.status === 'completed').length,
        inProgress: machineStatuses.filter((m) => m.status === 'in_progress').length,
        scheduled: machineStatuses.filter((m) => m.status === 'scheduled').length,
        overdue: machineStatuses.filter((m) => m.status === 'overdue').length,
        notScheduled: machineStatuses.filter((m) => m.status === 'not_scheduled').length,
      };
    };

    return {
      currentMonthData: calculateMonthData(selectedMonth),
    };
  }, [machines, scheduledMaintenances, selectedMonth]);

 
  const goToPreviousMonth = () => setSelectedMonth((prev) => subMonths(prev, 1));
  const goToNextMonth = () => setSelectedMonth((prev) => addMonths(prev, 1));

  const isFutureMonth = selectedMonth > new Date();

  return (

        <div
          className="flex h-full flex-col rounded-xl border-0 bg-gradient-to-br from-slate-50 to-slate-300 p-4 transition-all hover:shadow-md dark:from-slate-950/30 dark:to-slate-950/20"
      
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-base font-semibold">{format(selectedMonth, 'MMMM yyyy')}</h3>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={goToNextMonth} disabled={isFutureMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Summary */}
          <div className="mb-4 grid grid-cols-5 gap-1.5 rounded-lg bg-white p-3 dark:bg-black/20">
            <div className="flex flex-col items-center">
              <div className="text-sm font-bold text-green-600">{currentMonthData.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-sm font-bold text-blue-600">{currentMonthData.inProgress}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-sm font-bold text-yellow-600">{currentMonthData.scheduled}</div>
              <div className="text-xs text-muted-foreground">Scheduled</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-sm font-bold text-red-600">{currentMonthData.overdue}</div>
              <div className="text-xs text-muted-foreground">Overdue</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-sm font-bold text-gray-600">{currentMonthData.notScheduled}</div>
              <div className="text-xs text-muted-foreground">Not Scheduled</div>
            </div>
          </div>

          {/* Machines Grid */}
          <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarGutter: 'stable', scrollbarWidth: 'thin' }}>
            <TooltipProvider>
              <div className="grid grid-cols-4 gap-2">
                {currentMonthData.machineStatuses.map(({ machine, status }) => (
                  <Tooltip key={machine.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex flex-col items-center justify-center gap-1 rounded-lg p-2.5 transition-all duration-200 hover:scale-105 cursor-help ${getStatusColor(
                          status,
                        )}`}
                      >
                        <div className="opacity-100">{getMachineIcon(machine.name)}</div>
                        <span className="line-clamp-2 text-center text-xs font-semibold leading-tight">{machine.name}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] shadow-lg">
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold">{machine.name}</p>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span className="capitalize">{getStatusLabel(status)}</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </div>
      
  );
}