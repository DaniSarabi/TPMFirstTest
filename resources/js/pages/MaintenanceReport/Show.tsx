import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageViewerModal } from '@/components/ui/image-viewer-modal';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { MaintenanceReport, MaintenanceTemplateTask } from '@/types/maintenance';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, CircleX, Download, FileText, Hash, Pilcrow, SquareCheckBig } from 'lucide-react';
import { useState } from 'react';

interface Props extends PageProps {
  report: MaintenanceReport;
}

const ResultIcon = ({ task, result }: { task: MaintenanceTemplateTask; result: any }) => {
  // FIX: Check for both boolean true and the string "1"
  if (task.task_type === 'checkbox') {
    return result === true || result === '1' ? (
      <SquareCheckBig className="h-5 w-5 text-green-500" />
    ) : (
      <CircleX className="h-5 w-5 text-muted-foreground" />
    );
  }
  if (result === 'pass') return <CheckCircle className="h-5 w-5 text-green-500" />;
  if (result === 'fail') return <CircleX className="h-5 w-5 text-red-500" />;
  if (typeof result === 'number' || (typeof result === 'string' && !isNaN(Number(result)))) return <Hash className="h-5 w-5 text-blue-500" />;
  return <Pilcrow className="h-5 w-5 text-muted-foreground" />;
};

// Helper to format the result text
const formatResultText = (task: MaintenanceTemplateTask, result: any) => {
  if (result === null) {
    return <span className="text-muted-foreground italic">Optional field, not filled out.</span>;
  }
  // FIX: Check for both boolean true and the string "1"
  if (task.task_type === 'checkbox') {
    return result === true || result === '1' ? 'Marked as completed' : 'Not completed';
  }
  return String(result);
};
export default function MaintenanceReportShow({ report }: Props) {
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const wasCompletedOverdue = report.scheduled_maintenance.status === 'completed_overdue';

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Calendar', href: route('maintenance-calendar.index') },
    { title: `Report #${report.id}`, href: '#', isCurrent: true },
  ];

  const handleViewImage = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setIsImageViewerOpen(true);
  };

  // --- FIX: Use optional chaining to prevent crashes ---
  // This safely accesses the nested tasks and defaults to an empty array if any part of the chain is missing.
  const tasks = report.scheduled_maintenance?.template?.tasks || [];
  const tasksMap = new Map(tasks.map((task) => [task.label, task]));

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Report: ${report.scheduled_maintenance?.title}`} />
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Maintenance Report #{report.id}</h1>
            <span>
              Details for the maintenance of <span className="font-semibold">{report.scheduled_maintenance?.title}</span>
            </span>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Avatar className="h-6 w-6">
                <AvatarImage src={report.user?.avatar_url} />
                <AvatarFallback>{report.user?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>
                Completed by <span className="font-semibold">{report.user?.name}</span> on{' '}
                <span className="font-semibold">{format(new Date(report.completed_at), 'PPP')}</span>.
              </span>
            </div>
          </div>
          <Button asChild>
            <a href={route('maintenance-reports.pdf', report.id)} target="_blank">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </a>
          </Button>
        </div>

        {/* --- New Overdue Warning Alert --- */}
        {wasCompletedOverdue && (
          <Alert variant="default" className="border-0 bg-yellow-100 text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-base font-bold">Completed Overdue</AlertTitle>
            <AlertDescription className="text-yellow-600">This maintenance was completed after its grace period had ended.</AlertDescription>
          </Alert>
        )}
        {/* Main Content */}
        <Card className="shadow-lg drop-shadow-lg">
          <CardHeader>
            <CardTitle>Maintenance Results</CardTitle>
            <CardDescription>Target: {report.scheduled_maintenance?.schedulable.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {report.notes && (
              <div className="rounded-md border bg-muted/50 p-4">
                <h4 className="font-semibold">General Notes</h4>
                <p className="whitespace-pre-wrap text-muted-foreground">{report.notes}</p>
              </div>
            )}

            <div className="rounded-md border shadow-lg drop-shadow-sm">
              {report.results.map((item, index) => {
                const task = tasksMap.get(item.task_label);
                if (!task) return null;

                return (
                  <div key={item.id}>
                    <div className="flex flex-col gap-4 p-4">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-start gap-4">
                          <ResultIcon task={task} result={item.result} />
                          <div>
                            <p className="font-medium">{item.task_label}</p>
                            <p className="rounded-lg bg-muted px-2 text-sm text-muted-foreground italic">{task.description}</p>
                            <p className="mt-1 text-lg font-bold text-primary">{formatResultText(task, item.result)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex w-full flex-wrap items-start justify-end gap-4">
                        {task.options?.comment_required &&
                          (item.comment ? (
                            <div className="flex w-full items-start gap-2 rounded-md border bg-muted/50 p-2 text-sm text-muted-foreground md:w-auto md:flex-1">
                              <FileText className="h-4 w-4 shrink-0" />
                              <span className="break-all">{item.comment}</span>
                            </div>
                          ) : (
                            <div className="flex w-full items-start gap-2 rounded-md border border-dashed p-2 text-sm text-muted-foreground md:w-auto md:flex-1">
                              <span>Optional comment not provided.</span>
                            </div>
                          ))}
                        {item.photos.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.photos.map((photo) => (
                              <button key={photo.id} onClick={() => handleViewImage(photo.photo_url)} className="relative h-20 w-20">
                                <img src={photo.photo_url} className="h-full w-full rounded-md object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {index < report.results.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      <ImageViewerModal isOpen={isImageViewerOpen} onOpenChange={setIsImageViewerOpen} imageUrl={selectedImageUrl} imageAlt="Maintenance Photo" />
    </AppLayout>
  );
}
