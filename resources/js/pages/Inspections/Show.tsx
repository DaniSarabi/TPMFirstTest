import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Camera, CheckCircle, CircleAlert, CircleX, FileText, Ticket } from 'lucide-react';

// --- Type Definitions for this page ---
// These should match the data structure sent from the controller
interface InspectionStatus {
  id: number;
  name: string;
  severity: number;
  bg_color: string;
  text_color: string;
}

interface InspectionPoint {
  id: number;
  name: string;
}

interface InspectionReportItem {
  id: number;
  comment: string | null;
  image_url: string | null;
  status: InspectionStatus;
  point: InspectionPoint;
  // We will add a ticket_id here later
}

interface Subsystem {
  id: number;
  name: string;
  // We will need to group items by subsystem
  report_items: InspectionReportItem[];
}

interface Report {
  id: number;
  status: string;
  start_date: string;
  completion_date: string | null;
  user_name: string;
  machine_name: string;
  // The items will be grouped by subsystem
  grouped_items: Subsystem[];
}

interface ShowPageProps {
  report: Report;
}

// --- Reusable Components for this page ---
const StatusIcon = ({ severity }: { severity: number }) => {
  if (severity === 0) return <CheckCircle className="h-5 w-5 text-green-500" />;
  if (severity === 1) return <CircleAlert className="h-5 w-5 text-yellow-500" />;
  if (severity === 2) return <CircleX className="h-5 w-5 text-red-500" />;
  return null;
};

export default function Show({ report }: ShowPageProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Inspections',
      href: route('inspections.index'),
    },
    {
      title: `Report #${report.id}`,
      href: route('inspections.show', report.id),
      isCurrent: true,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Inspection Report #${report.id}`} />

      <div className="space-y-6 p-6">
        {/* --- Header Summary --- */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inspection Report #{report.id}</h1>
            <p className="text-muted-foreground">
              Details for inspection on <span className="font-semibold">{report.machine_name}</span> by{' '}
              <span className="font-semibold">{report.user_name}</span>.
            </p>
          </div>
        </div>

        {/* --- Main Content --- */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection Results</CardTitle>
            <CardDescription>Completed on: {report.completion_date}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {report.grouped_items.map((subsystem) => (
              <div key={subsystem.id}>
                <h3 className="mb-2 text-lg font-semibold">{subsystem.name}</h3>
                <div className="rounded-md border">
                  {subsystem.report_items.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex items-start justify-between p-4">
                        <div className="flex items-start gap-4">
                          <StatusIcon severity={item.status.severity} />
                          <div>
                            <p className="font-medium">{item.point.name}</p>
                            <Badge
                              className="mt-1"
                              style={{
                                backgroundColor: item.status.bg_color,
                                color: item.status.text_color,
                              }}
                            >
                              {item.status.name}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {item.comment && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>{item.comment}</span>
                            </div>
                          )}
                          {item.image_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={item.image_url} target="_blank" rel="noopener noreferrer">
                                <Camera className="mr-2 h-4 w-4" /> View Photo
                              </a>
                            </Button>
                          )}
                          {/* Placeholder for ticket button */}
                          {item.status.severity > 0 && (
                            <Button size="sm">
                              <Ticket className="mr-2 h-4 w-4" /> View Ticket
                            </Button>
                          )}
                        </div>
                      </div>
                      {index < subsystem.report_items.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
