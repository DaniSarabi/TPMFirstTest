import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScheduledMaintenance } from '@/types/maintenance';
import { HardHat, Cog, Bolt } from 'lucide-react';

interface StatusProps {
  status: string;
}

export function StatusBadge({ status }: StatusProps) {
  const statusStyles: { [key: string]: string } = {
    scheduled: 'bg-blue-500',
    in_progress: 'bg-yellow-500',
    in_progress_overdue: 'bg-yellow-500',
    completed: 'bg-green-500',
    overdue: 'bg-red-500',
    completed_overdue: 'bg-orange-500',
  };

  const formattedStatus = status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return <Badge className={cn('px-3 py-1  text-sm text-white', statusStyles[status] || 'bg-gray-400')}>{formattedStatus}</Badge>;
}

interface Props {
  maintenance: ScheduledMaintenance;
}


export function TargetBadge({ maintenance }: Props) {
    const isMachine = maintenance.schedulable_type.endsWith('Machine');

    const Icon = isMachine ? Cog : Bolt;
    const label = maintenance.schedulable.name;

    return (
        <Badge
            variant="outline"
            className={cn(
                'flex items-center gap-1 px-3 py-1 text-sm',
                isMachine ? 'border-blue-500 text-blue-500' : 'border-cyan-500 text-cyan-500'
            )}
        >
            <Icon className="h-4 w-4" />
            {label}
        </Badge>
    );
}