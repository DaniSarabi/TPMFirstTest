import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/user-avatar';
import { cn } from '@/lib/utils';
import { ScheduledMaintenance } from '@/types/maintenance';
import { Link } from '@inertiajs/react';
import { format, isValid } from 'date-fns';
import { Calendar, CalendarX2, CheckCircle, Clock, Play, Server, Wrench } from 'lucide-react';

// --- Helper Components based on your example ---

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Completed',
          className: 'bg-green-300 text-green-800 ',
        };

      case 'completed_overdue':
        return {
          icon: <CheckCircle className="h-3 w-3 text-orange-800" />,
          text: 'Completed Overdue',
          className: 'bg-orange-300 text-orange-800 ',
        };

      case 'in_progress':
        return {
          icon: <Play className="h-3 w-3" />,
          text: 'In Progress',
          className: 'bg-yellow-300 text-yellow-800',
        };

      case 'in_progress_overdue':
        return {
          icon: <Play className="h-3 w-3" />,
          text: 'In Progress Overdue',
          className: 'bg-orange-300 text-orange-800 ',
        };

      case 'scheduled':
        return {
          icon: <Calendar className="h-3 w-3" />,
          text: 'Scheduled',
          className: 'bg-cyan-300 text-cyan-800 ',
        };

      case 'overdue':
        return {
          icon: <CalendarX2 className="h-3 w-3" />,
          text: 'Overdue',
          className: 'bg-red-300 text-red-800 ',
        };

      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          text: status.replace(/_/g, ' '),
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
  };

  const { icon, text, className } = getStatusConfig(status);

  return (
    <Badge className={cn('flex items-center gap-1.5', className)}>
      {icon}
      <span>{text}</span>
    </Badge>
  );
};

const TargetBadge = ({ maintenance }: { maintenance: ScheduledMaintenance }) => {
  const isMachine = maintenance.schedulable_type.includes('Machine');

  const icon = isMachine ? <Server className="h-3 w-3" /> : <Wrench className="h-3 w-3" />;
  const text = isMachine ? 'Machine' : 'Subsystem';
  const className = isMachine ? 'bg-sky-200 text-sky-800 ' : 'bg-indigo-200 text-indigo-800 ';

  return (
    <Badge variant="secondary" className={cn('flex items-center gap-1.5 text-xs', className)}>
      {icon}
      <span>{text}</span>
    </Badge>
  );
};

// --- Main Card Component ---

interface MaintenanceCardProps {
  maintenance: ScheduledMaintenance;
}

export function MaintenanceCard({ maintenance }: MaintenanceCardProps) {
  const isCompleted = ['completed', 'completed_overdue'].includes(maintenance.status);

  const scheduledDate = new Date(maintenance.scheduled_date);
  const dateText = isValid(scheduledDate) ? format(scheduledDate, 'PPP') : 'Date not set';

  const completedDate = maintenance.report?.completed_at ? new Date(maintenance.report.completed_at) : null;
  const completedDateText = completedDate && isValid(completedDate) ? format(completedDate, 'PPP') : null;

  const completedBy = maintenance.report?.user;

  const completionColorClass = maintenance.status === 'completed_overdue' ? 'text-orange-500' : 'text-green-600';

  const CardContent = () => (
    <div className="flex h-full flex-col rounded-lg border-0 bg-card p-4 text-card-foreground shadow-lg transition-all hover:border-primary hover:bg-accent">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-1">
          <StatusBadge status={maintenance.status} />
          <TargetBadge maintenance={maintenance} />
          <Badge variant="secondary" className="flex items-center text-xs">
            #{maintenance.id}
          </Badge>
        </div>
        <h3 className="font-semibold">{maintenance.title}</h3>
        <p className="!mt-1 text-sm text-muted-foreground italic">{maintenance.schedulable.name}</p>
        <div className="mt-4 space-y-2 border-t border-primary pt-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Scheduled for:</span>
            <span className="pr-9 font-medium text-foreground">{dateText}</span>
          </div>

          {/* ACTION: Muestra la fecha de finalización y el avatar del usuario */}
          {isCompleted && completedDateText && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Completed on:</span>
              <div className="flex items-center gap-2">
                <span className={cn('pr-2 font-medium', completionColorClass)}>{completedDateText}</span>
                {completedBy && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <UserAvatar user={completedBy} className="h-5 w-5" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{completedBy.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // The entire card is a link if a report exists
  if (maintenance.report) {
    return (
      <Link href={route('maintenance-reports.show', maintenance.report.id)} className="transition-transform hover:-translate-y-1">
        <CardContent />
      </Link>
    );
  }

  // Otherwise, it's just a div
  return <CardContent />;
}
