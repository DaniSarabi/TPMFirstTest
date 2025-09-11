import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduledMaintenance } from '@/types/maintenance';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  maintenance: ScheduledMaintenance;
  onStart: (logDowntime: boolean) => void;
}

export function StartScreen({ maintenance, onStart }: Props) {
  return (
    <Card className="mx-auto max-w-2xl shadow-lg drop-shadow-lg">
      <CardHeader>
        <CardTitle>Start Maintenance Task</CardTitle>
        <CardDescription>
          You are about to start the maintenance task: <strong>{maintenance.title}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Before you begin, please confirm if performing this maintenance will require the machine to be taken out of service. This will log downtime
          for reporting purposes.
        </p>
        <div className="flex flex-col items-center gap-4 ">
          <Button className="w-full" variant="outline" onClick={() => onStart(false)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Start (No Downtime)
          </Button>
          <Button className="w-full" variant="destructive" onClick={() => onStart(true)}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Start & Log Downtime
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
