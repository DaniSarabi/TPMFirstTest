import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduledMaintenance } from '@/types/maintenance';
import { Link } from '@inertiajs/react';
import { format, isValid } from 'date-fns';
import { Download, Eye } from 'lucide-react';
import { StatusBadge, TargetBadge } from './StatusBadgeHelper';

interface Props {
  maintenances: ScheduledMaintenance[];
  machineId: number;
}

const MaintenanceListItem = ({ item }: { item: ScheduledMaintenance }) => {
  const isCompleted = ['completed', 'completed_overdue'].includes(item.status);

  const scheduledDate = new Date(item.scheduled_date);
  const dateText = isValid(scheduledDate) ? format(scheduledDate, 'PPP') : 'Date not set';

  return (
    <div className="flex items-center justify-between rounded-md border p-4 shadow-lg drop-shadow-lg bg-card hover:bg-muted">
      <div>
        <p className="font-semibold">{item.title}</p>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Scheduled for: {dateText}</p>

          <TargetBadge maintenance={item} />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <StatusBadge status={item.status} />
        {isCompleted && item.report && (
          <Button asChild variant="outline" size="sm">
            <Link href={route('maintenance-reports.show', item.report.id)}>
              <Eye className="mr-2 h-4 w-4" /> View Report
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export function MaintenanceTab({ maintenances, machineId }: Props) {
  const upcoming = maintenances.filter((m) => !['completed', 'completed_overdue'].includes(m.status));
  const history = maintenances.filter((m) => ['completed', 'completed_overdue'].includes(m.status));

  return (
    <Card className="shadow-lg drop-shadow-lg bg-background border-border">
      <CardHeader>
 <div className="flex items-center justify-between">
                    <CardTitle>Maintenance History & Schedule</CardTitle>
                    <Button asChild size="sm">
                        <a href={route('machines.maintenance-schedule.pdf', machineId)} target='_blank'>
                            <Download className="mr-2 h-4 w-4" />
                            Download Schedule
                        </a>
                    </Button>
                </div>      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-semibold text-primary">Upcoming Schedule</h3>
          {upcoming.length > 0 ? (
            <div className="space-y-2">
              {upcoming.map((item) => (
                <MaintenanceListItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No upcoming maintenance scheduled.</p>
          )}
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold text-primary">Maintenance History</h3>
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((item) => (
                <MaintenanceListItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No maintenance history for this machine.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
