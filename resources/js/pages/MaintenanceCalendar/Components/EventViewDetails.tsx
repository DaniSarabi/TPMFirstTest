import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScheduledMaintenanceEvent } from '@/types/maintenance';
import { Repeat } from 'lucide-react';

interface Props {
  event: ScheduledMaintenanceEvent;
}

export function EventViewDetails({ event }: Props) {
  const { start, extendedProps } = event;
  const { status, schedulableName, schedulableType, series_id, grace_period_days } = extendedProps;

      const scheduledDate = new Date(start + 'T00:00:00');
  const dueDate = new Date(start);
  dueDate.setDate(dueDate.getDate() + grace_period_days + 1);

  return (
    <div className="space-y-4 py-4">
      <Separator className="border-1 border-primary bg-primary" />
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="font-semibold">Target:</span>
          <span className="text-muted-foreground">
            {schedulableType}: {schedulableName}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Status:</span>
          <Badge variant={status === 'completed' ? 'default' : 'secondary'}>{status}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Scheduled Date:</span>
                    <span className="text-muted-foreground">{scheduledDate.toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Due Date:</span>
          <span className="text-muted-foreground">
            {dueDate.toLocaleDateString()} ({grace_period_days} day grace)
          </span>
        </div>
        {series_id && (
          <div className="justify-center flex items-center pt-2 text-muted-foreground">
            <Repeat className="mr-2 h-4 w-4" />
            This is part of a recurring series.
          </div>
        )}
      </div>
    </div>
  );
}
