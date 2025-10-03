import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageViewerModal } from '@/components/ui/image-viewer-modal';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { MaintenanceReport, MaintenanceReportResult, MaintenanceTemplateTask } from '@/types/maintenance';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Calendar, Camera, CheckCircle, CircleX, FileText, Hash, Pilcrow, SquareCheckBig, User, Wrench } from 'lucide-react';
import React, { useState } from 'react';

// ============================================================================
// --- Helper Components for this Page ---
// ============================================================================

const StatCard = ({ icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null }) => (
  <div className="text-md flex justify-between text-primary-foreground">
    <div className="flex items-center gap-2">
      {React.createElement(icon, { className: 'h-4 w-4' })}
      <span>{label}</span>
    </div>
    <span className="font-semibold">{value ?? 'N/A'}</span>
  </div>
);

const ResultIcon = ({ task, result }: { task: MaintenanceTemplateTask; result: any }) => {
  if (result === null || result === undefined) {
    return <CircleX className="h-5 w-5 text-muted-foreground" />;
  }
  if (task.task_type === 'checkbox') {
    return result ? <SquareCheckBig className="h-5 w-5 text-green-500" /> : <CircleX className="h-5 w-5 text-muted-foreground" />;
  }
  if (result === 'pass') return <CheckCircle className="h-5 w-5 text-green-500" />;
  if (result === 'fail') return <CircleX className="h-5 w-5 text-red-500" />;
  if (result) return <Hash className="h-5 w-5 text-blue-500" />;
  return <Pilcrow className="h-5 w-5 text-muted-foreground" />;
};

const formatResultDisplay = (task: MaintenanceTemplateTask, result?: MaintenanceReportResult) => {
  const resultValue = result?.result;

  if (!result || resultValue === null || resultValue === '') {
    if (task.options?.is_mandatory) {
      return <span className="font-semibold text-destructive italic">Mandatory, not completed</span>;
    }
    return <span className="text-muted-foreground italic">Optional, not filled out</span>;
  }

  if (task.task_type === 'checkbox') {
    return String(resultValue) === '1' || resultValue === true ? 'Marked as completed' : 'Not completed';
  }

  return String(resultValue);
};

const ReportTaskItem = ({
  task,
  result,
  onViewImage,
}: {
  task: MaintenanceTemplateTask;
  result?: MaintenanceReportResult;
  onViewImage: (imageUrl: string) => void;
}) => {
  if (['header', 'paragraph', 'bullet_list'].includes(task.task_type)) {
    switch (task.task_type) {
      case 'header':
        return <h2 className="pt-6 pb-2 text-xl font-bold text-primary">{task.label}</h2>;
      case 'paragraph':
        return <p className="pb-4 text-muted-foreground">{task.description}</p>;
      case 'bullet_list':
        return (
          <div className="py-2">
            <p className="font-semibold">{task.label}</p>
            {task.options?.list_items && (
              <ul className="list-disc space-y-1 pt-2 pl-5 text-muted-foreground">
                {task.options.list_items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="py-4">
      <div className="flex flex-col gap-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-start gap-4">
            <ResultIcon task={task} result={result?.result} />
            <div>
              <p className="font-medium">{task.label}</p>
              <div className="text-lg font-bold text-primary capitalize">{formatResultDisplay(task, result)}</div>
            </div>
          </div>
        </div>
        {result && (
          <div className="flex w-full flex-wrap items-center justify-end gap-2 md:flex-nowrap">
            {result.comment && (
              <div className="flex w-full items-start gap-2 rounded-md border bg-muted/50 p-2 text-sm text-muted-foreground md:w-auto md:flex-1">
                <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="whitespace-pre-wrap">{result.comment}</span>
              </div>
            )}
            {result.photos.length > 0 &&
              result.photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => onViewImage(photo.photo_url)}
                  className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-md ring-1 ring-border transition-all hover:ring-2 hover:ring-primary"
                >
                  <img src={photo.photo_url} alt="Maintenance thumbnail" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// --- Componente Principal de la Página ---
// ============================================================================

interface Props extends PageProps {
  report: MaintenanceReport;
}

export default function MaintenanceReportShow({ report }: Props) {
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { template } = report.scheduled_maintenance;

  const { allPhotos, summaryStats, renderableItems, resultsMap } = React.useMemo(() => {
    const allPhotos = report.results.flatMap((result) => result.photos);
    const resultsMap = new Map(report.results.map((r) => [r.task_label, r]));
    const resultSet = new Set(report.results.map((r) => r.task_label));

    const filteredRootTasks = (template.tasks || []).filter((task) => resultSet.has(task.label));

    const filteredSections = (template.sections || [])
      .map((section) => ({
        ...section,
        tasks: section.tasks.filter((task) => resultSet.has(task.label)),
      }))
      .filter((section) => section.tasks.length > 0);

    const renderableItems = [...filteredSections, ...filteredRootTasks].sort((a, b) => a.order - b.order);

    let completed = 0,
      pass = 0,
      fail = 0;
    report.results.forEach((r) => {
      if (r.result !== null && r.result !== '') completed++;
      if (r.result === 'pass') pass++;
      if (r.result === 'fail') fail++;
    });
    const summaryStats = { completed, pass, fail, total: report.results.length };

    return { allPhotos, summaryStats, renderableItems, resultsMap };
  }, [report, template]);
  React.useEffect(() => {
    if (allPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allPhotos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [allPhotos.length]);

  const handleViewImage = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setIsImageViewerOpen(true);
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Calendar', href: route('maintenance-calendar.index') },
    { title: `Report #${report.id}`, href: '#', isCurrent: true },
  ];
  const wasCompletedOverdue = report.scheduled_maintenance.status === 'completed_overdue';

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Report #${report.id}`} />

      <div className="space-y-6 p-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">Maintenance Report #{report.id}</h1>
          <CardDescription>Target: {report.scheduled_maintenance?.schedulable.name}</CardDescription>{' '}
        </div>
        {wasCompletedOverdue && (
          <Alert variant="default" className="border-0 bg-yellow-100 text-yellow-600">
            <AlertTriangle className="h-4 w-4" /> <AlertTitle className="text-base font-bold">Completed Overdue</AlertTitle>
            <AlertDescription className="text-yellow-600">This maintenance was completed after its grace period had ended.</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="col-span-1 space-y-6 self-start lg:sticky lg:top-6">
            <Card className="overflow-hidden bg-primary shadow-lg">
              <CardHeader className="p-0">
                <div className="relative aspect-video w-full">
                  <AnimatePresence>
                    <motion.img
                      key={currentImageIndex}
                      src={allPhotos[currentImageIndex]?.photo_url || 'https://placehold.co/600x400/18181b/ffffff?text=No+Images'}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute h-full w-full object-cover"
                    />
                  </AnimatePresence>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="mb-4 text-primary-foreground">Report Summary</CardTitle>
                <div className="space-y-3">
                  <StatCard icon={User} label="Completed by" value={report.user?.name} />
                  <StatCard icon={Calendar} label="Completed on" value={format(new Date(report.completed_at), 'PPP')} />
                  <Separator className="bg-primary-foreground/20" />
                  <StatCard icon={CheckCircle} label="Passed" value={summaryStats.pass > 0 ? summaryStats.pass : null} />
                  <StatCard icon={CircleX} label="Failed" value={summaryStats.fail > 0 ? summaryStats.fail : null} />
                  <StatCard icon={SquareCheckBig} label="Total Completed" value={`${summaryStats.completed} / ${summaryStats.total}`} />
                </div>
              </CardContent>
            </Card>
            {report.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>General Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">{report.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="col-span-1 lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Checklist Details</CardTitle>
                <CardDescription>Results for each item in the maintenance report.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderableItems.map((item) => {
                  if ('tasks' in item) {
                    return (
                      <div key={`section-${item.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Wrench className="h-5 w-5" />
                          </div>
                          <h3 className="text-lg font-semibold">{item.title}</h3>
                        </div>
                        <div className="mt-2 ml-4 border-l-2 border-primary/20 pl-7">
                          {item.tasks
                            .sort((a, b) => a.order - b.order)
                            .map((task) => (
                              <ReportTaskItem key={task.id} task={task} result={resultsMap.get(task.label)} onViewImage={handleViewImage} />
                            ))}
                        </div>
                      </div>
                    );
                  }

                  const task = item;
                  return <ReportTaskItem key={task.id} task={task} result={resultsMap.get(task.label)} onViewImage={handleViewImage} />;
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ImageViewerModal isOpen={isImageViewerOpen} onOpenChange={setIsImageViewerOpen} imageUrl={selectedImageUrl} imageAlt="Maintenance Photo" />
    </AppLayout>
  );
}
