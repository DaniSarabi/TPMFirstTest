import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageViewerModal } from '@/components/ui/image-viewer-modal';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertTriangle, Camera, CheckCircle, CircleAlert, CircleX, Download, FileText, Ticket } from 'lucide-react';
import * as React from 'react';

// --- Type Definitions for this page ---
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
}

interface Subsystem {
  id: number;
  name: string;
  report_items: InspectionReportItem[];
}

interface Report {
  id: number;
  status: string;
  start_date: string;
  completion_date: string | null;
  user_name: string;
  machine_name: string;
  grouped_items: Subsystem[];
  status_change_info: string | null;
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
  const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = React.useState('');

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

  const handleViewImage = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setIsImageViewerOpen(true);
  };

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
            {report.status_change_info && (
              <Badge variant="secondary" className="mt-2">
                <AlertTriangle className="mr-2 h-4 w-4" />
                {report.status_change_info}
              </Badge>
            )}
          </div>
          <Button asChild>
            <a href={route('inspections.pdf', report.id)} target="_blank">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </a>
          </Button>
        </div>

        {/* --- Main Content --- */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection Results</CardTitle>
            <CardDescription>Completed on: {report.completion_date}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {report.grouped_items?.map((subsystem) => (
              <div key={subsystem.id}>
                <h3 className="mb-2 text-lg font-semibold">{subsystem.name}</h3>
                <div className="rounded-md border">
                  {subsystem.report_items?.map((item, index) => (
                    <div key={item.id}>
                      {/* ---  This container is now responsive --- */}
                      <div className="flex flex-col gap-4 p-4">
                        {/* Top Row: Point Name and Status */}
                        <div className="flex w-full items-center justify-between">
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
                        </div>
                        {/* Bottom Row: Comment and actions */}
                        <div className="flex w-full flex-wrap items-center justify-end gap-2 md:flex-nowrap">
                          {item.comment && (
                            <div className="flex w-full items-start gap-2 rounded-md border bg-muted/50 p-2 text-sm text-muted-foreground md:w-auto md:flex-1">
                              <FileText className="h-4 w-4 shrink-0" />
                              <span className="break-all">{item.comment}</span>
                            </div>
                          )}
                          {item.image_url && (
                            <Button variant="outline" size="sm" onClick={() => handleViewImage(item.image_url!)}>
                              <Camera className="mr-2 h-4 w-4" /> View Photo
                            </Button>
                          )}
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

      <ImageViewerModal isOpen={isImageViewerOpen} onOpenChange={setIsImageViewerOpen} imageUrl={selectedImageUrl} imageAlt="Inspection Photo" />
    </AppLayout>
  );
}
