import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageViewerModal } from '@/components/ui/image-viewer-modal';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DetailedReport, InspectionReportItem } from '@/types/inspection';
import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Calendar,
  Camera,
  CheckCircle,
  CircleAlert,
  CircleX,
  Clock,
  Download,
  FileText,
  Ticket,
  Trash2,
  User,
  Wrench,
} from 'lucide-react';
import * as React from 'react';

interface ShowPageProps {
  report: DetailedReport;
}

// --- Componentes Reutilizables para esta Página ---

const StatusIcon = ({ severity }: { severity: number }) => {
  if (severity === 0) return <CheckCircle className="h-5 w-5 text-green-500" />;
  if (severity === 1) return <CircleAlert className="h-5 w-5 text-yellow-500" />;
  if (severity === 2) return <CircleX className="h-5 w-5 text-red-500" />;
  return null;
};

// Tarjeta para mostrar estadísticas en la columna izquierda
const StatCard = ({ icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null }) => (
  <div className="text-md flex justify-between text-primary-foreground">
    <div className="flex items-center gap-2">
      {React.createElement(icon, { className: 'h-4 w-4 stroke-3' })}
      <span>{label}</span>
    </div>
    <span className="font-medium">{value ?? 'N/A'}</span>
  </div>
);

export default function Show({ report }: ShowPageProps) {
  const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = React.useState('');
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  // ACTION: Se extraen todas las imágenes del reporte en un solo array
  const allImages = React.useMemo(() => {
    return report.grouped_items
      .flatMap((subsystem) => subsystem.report_items)
      .filter((item): item is InspectionReportItem & { image_url: string } => !!item.image_url);
  }, [report.grouped_items]);

  // ACTION: Se calculan las estadísticas totales de la inspección
  const totalStats = React.useMemo(() => {
    let ok = 0,
      warning = 0,
      critical = 0;
    report.grouped_items.forEach((subsystem) => {
      subsystem.report_items.forEach((item) => {
        if (item.status.severity === 0) ok++;
        if (item.status.severity === 1) warning++;
        if (item.status.severity === 2) critical++;
      });
    });
    return { ok, warning, critical };
  }, [report.grouped_items]);

  // ACTION: Hook para el carrusel automático de imágenes
  React.useEffect(() => {
    if (allImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % allImages.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [allImages.length]);

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inspections', href: route('inspections.index') },
    { title: `Report #${report.id}`, href: route('inspections.show', report.id), isCurrent: true },
  ];

  const handleViewImage = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setIsImageViewerOpen(true);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Inspection Report #${report.id}`} />

      <div className="space-y-6 p-6">
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inspection Report #{report.id}</h1>
            <p className="text-muted-foreground">
              Review of <span className="font-semibold">{report.machine_name || 'N/A'}</span>
            </p>
          </div>
          <Button asChild>
            <a href={route('inspections.pdf', report.id)} target="_blank">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </a>
          </Button>
        </div>
        {report.is_machine_deleted && (
          <Alert variant="default" className="items-center border-0 bg-yellow-100 text-yellow-600">
            <AlertTriangle className="h-8 w-8" />
            <AlertTitle className="text-base font-bold">Deleted machine</AlertTitle>
            <AlertDescription className="text-yellow-600">This report is from a machine that has been deleted.</AlertDescription>
          </Alert>
        )}

        {/* --- GRID PRINCIPAL DE DOS COLUMNAS --- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* --- COLUMNA IZQUIERDA: RESUMEN Y FOTOS --- */}
          <div className="col-span-1 space-y-6 self-start lg:sticky lg:top-6">
            <Card className="overflow-hidden bg-primary shadow-lg">
              <CardHeader className="p-0">
                <div className="relative aspect-video w-full">
                  <AnimatePresence>
                    <motion.img
                      key={currentImageIndex}
                      src={allImages[currentImageIndex]?.image_url || 'https://placehold.co/600x400/e2e8f0/cccccc?text=No+Images'}
                      alt={`Inspection photo ${currentImageIndex + 1}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute h-full w-full rounded-xl object-cover p-4"
                    />
                  </AnimatePresence>
                  {allImages.length > 1 && (
                    <div className="absolute right-2 bottom-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="mb-4 text-primary-foreground">Report Summary</CardTitle>
                <div className="space-y-3">
                  <StatCard icon={User} label="Inspected by" value={report.user_name} />
                  <StatCard icon={Calendar} label="Completed on" value={report.completion_date} />
                  <StatCard icon={Clock} label="Duration" value={report.duration} />
                  {report.is_machine_deleted && (
                    <div className="text-md flex justify-between">
                      <span className="flex items-center gap-2 text-primary-foreground">
                        <Trash2 className="h-4 w-4" />
                        Machine Status
                      </span>
                      <Badge variant="destructive">Deleted</Badge>
                    </div>
                  )}
                  <Separator />
                  <StatCard icon={CheckCircle} label="OK" value={totalStats.ok} />
                  <StatCard icon={CircleAlert} label="Warnings" value={totalStats.warning} />
                  <StatCard icon={CircleX} label="Criticals" value={totalStats.critical} />
                </div>
              </CardContent>
            </Card>
            {report.status_change_info && !report.is_machine_deleted && (
              <Card className="border-amber-200 bg-amber-50 text-amber-900">
                <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
                  <AlertTriangle className="h-6 w-6" />
                  <div className="flex flex-col">
                    <CardTitle className="text-base">Status Change Triggered</CardTitle>
                    <CardDescription className="text-amber-700">{report.status_change_info}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            )}
          </div>

          {/* --- COLUMNA DERECHA: LISTA DE PUNTOS DE INSPECCIÓN --- */}
          <div className="col-span-1 lg:col-span-2">
            <Card className="border-0 shadow-lg drop-shadow-lg">
              <CardHeader>
                <CardTitle>Inspection Details</CardTitle>
                <CardDescription>Review of all checkpoints grouped by subsystem.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {report.grouped_items?.map((subsystem) => (
                  <div key={subsystem.id}>
                    {/* ACTION: Subsystem header con indicador de eliminado */}
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${subsystem.is_deleted ? 'bg-gray-300' : 'bg-primary/10 text-primary'}`}>
                        <Wrench className="h-5 w-5" />
                      </div>
                      <h3 className={`text-lg font-semibold ${subsystem.is_deleted ? 'text-muted-foreground' : ''}`}>
                        {subsystem.name}
                      </h3>
                      {/* ACTION: Badge indicando que el subsystem fue eliminado */}
                      {subsystem.is_deleted && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className=" bg-gray-300 text-gray-600 ">
                                <Trash2 className="mr-1 h-3 w-3" />
                                Deleted
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>This subsystem no longer exists in the current system configuration</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className={`mt-2 ml-4 border-l-2 pl-7 ${subsystem.is_deleted ? 'border-gray-300' : 'border-primary/20'}`}>
                      {subsystem.report_items?.map((item) => {
                        const ticketToShow = item.ticket || item.pinged_ticket;
                        const isPointDeleted = item.point?.is_deleted;
                        
                        return (
                          <div key={item.id} className={`py-4 ${isPointDeleted ? 'opacity-70' : ''}`}>
                            <div className="flex flex-col gap-4">
                              <div className="flex w-full items-center justify-between">
                                <div className="flex items-start gap-4">
                                  <StatusIcon severity={item.status.severity} />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className={`font-medium ${isPointDeleted ? 'text-muted-foreground' : ''}`}>
                                        {item.point.name}
                                      </p>
                                      {/* ACTION: Badge indicando que el inspection point fue eliminado */}
                                      {isPointDeleted && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Badge variant="outline"  className=" bg-gray-300 text-gray-600 text-">
                                                <Trash2 className="mr-1 h-2.5 w-2.5" />
                                                Deleted Point
                                              </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>This inspection point was removed from the system</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                    </div>
                                    <Badge className="mt-1" style={{ backgroundColor: item.status.bg_color, color: item.status.text_color }}>
                                      {item.status.name}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex w-full flex-wrap items-center justify-end gap-2 md:flex-nowrap">
                                {item.comment && (
                                  <div className="flex w-full items-start gap-2 rounded-md border bg-muted/50 p-2 text-sm text-muted-foreground md:w-auto md:flex-1">
                                    <FileText className="h-4 w-4 shrink-0" />
                                    <span className="break-all">{item.comment}</span>
                                  </div>
                                )}
                                {item.image_url && (
                                  <button
                                    onClick={() => handleViewImage(item.image_url!)}
                                    className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-md ring-1 ring-border transition-all hover:ring-2 hover:ring-primary"
                                  >
                                    <img src={item.image_url} alt="Inspection thumbnail" className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                      <Camera className="h-6 w-6 text-white" />
                                    </div>
                                  </button>
                                )}
                                {ticketToShow && (
                                  <Button size="sm" asChild>
                                    <Link href={route('tickets.show', ticketToShow.id)}>
                                      <Ticket className="mr-2 h-4 w-4" /> View Ticket
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ImageViewerModal isOpen={isImageViewerOpen} onOpenChange={setIsImageViewerOpen} imageUrl={selectedImageUrl} imageAlt="Inspection Photo" />
    </AppLayout>
  );
}