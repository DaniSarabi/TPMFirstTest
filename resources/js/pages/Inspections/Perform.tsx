import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Circle, CircleAlert, CircleCheck, CircleX, Clock, ClockArrowUp, ListCheck, Send, Wrench } from 'lucide-react';
import React from 'react';
import { ReportProblemModal } from './ReportProblemModal';

// --- Type Definitions for this page ---
// These should match the data structure sent from your controller

export interface InspectionPoint {
  id: number;
  name: string;
  description: string | null;
}

interface Subsystem {
  id: number;
  name: string;
  inspection_points: InspectionPoint[];
}

interface Creator {
  id: number;
  name: string;
}

interface MachineStatus {
  id: number;
  name: string;
  bg_color: string;
  text_color: string;
}

interface Machine {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  subsystems: Subsystem[];
  creator: Creator | null;
  created_at: string;
  machine_status: MachineStatus;
}

interface InspectionStatus {
  id: number;
  name: string;
  severity: number;
  bg_color: string;
  text_color: string;
  is_default: boolean;
}

interface InspectionReport {
  id: number;
  machine: Machine;
}
// Define the props for the page
interface PerformPageProps {
  report: InspectionReport;
  inspectionStatuses: InspectionStatus[];
  uptime: {
    since: string | null;
    duration: string | null;
  };
}

interface InspectionPointRowProps {
  point: InspectionPoint;
  statuses: InspectionStatus[];
  selectedValue: number | undefined;
  onChange: (statusId: number) => void;
}

function InspectionPointRow({ point, statuses, selectedValue, onChange }: InspectionPointRowProps) {
  const selectedStatus = statuses.find((s) => s.id === selectedValue);

  const Icon = React.useMemo(() => {
    if (!selectedStatus) return Circle;
    switch (selectedStatus.severity) {
      case 0:
        return CircleCheck;
      case 1:
        return CircleAlert;
      case 2:
        return CircleX;
      default:
        return Circle;
    }
  }, [selectedStatus]);

  const iconColor = React.useMemo(() => {
    if (!selectedStatus) return 'text-muted-foreground';
    switch (selectedStatus.severity) {
      case 0:
        return 'text-green-500';
      case 1:
        return 'text-yellow-500';
      case 2:
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  }, [selectedStatus]);

  return (
    <div key={point.id} className="flex items-center justify-between rounded-md p-2 hover:bg-muted">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-5 w-5', iconColor)} />
        <p className="font-medium">{point.name}</p>
      </div>
      <div className="flex items-center gap-2">
        <Select value={selectedValue ? String(selectedValue) : ''} onValueChange={(value) => onChange(Number(value))}>
          <SelectTrigger className="w-[180px] bg-accent shadow-sm">
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status.id} value={String(status.id)}>
                <div className="flex items-center">
                  <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: status.bg_color }} />
                  {status.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function Perform({ report, inspectionStatuses, uptime }: PerformPageProps) {
  const { machine } = report;

  const [inspectionResults, setInspectionResults] = React.useState<Record<number, { status_id?: number; comment?: string; image?: File | null }>>({});

  const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
  const [pointToReport, setPointToReport] = React.useState<InspectionPoint | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [isDirty, setIsDirty] = React.useState(false);
 
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const handleInertiaNavigate = (event: CustomEvent) => {
      if (isDirty && event.detail.url) {
        event.preventDefault();
      }
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    const removeInertiaListener = router.on('before', handleInertiaNavigate);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      removeInertiaListener();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const handleStatusChange = (pointId: number, statusId: number) => {
    // First, update the status in the local state
    setIsDirty(true);
    setInspectionResults((prev) => ({
      ...prev,
      [pointId]: { ...prev[pointId], status_id: statusId },
    }));

    // Then, check the severity to see if we need to open the modal
    const selectedStatus = inspectionStatuses.find((s) => s.id === statusId);
    if (selectedStatus && selectedStatus.severity > 0) {
      const point = machine.subsystems.flatMap((sub) => sub.inspection_points).find((p) => p.id === pointId);

      if (point) {
        setPointToReport(point);
        setIsReportModalOpen(true);
      }
    }
  };

  //  Create a handler to save the problem details ---
  const handleSaveProblem = ({ comment, image }: { comment: string; image: File | null }) => {
    if (!pointToReport) return;

    setInspectionResults((prev) => ({
      ...prev,
      [pointToReport.id]: {
        ...prev[pointToReport.id],
        comment: comment,
        image: image,
      },
    }));
  };

  const handleSubmitInspection = () => {
    setIsSubmitting(true);
    router.post(
      route('inspections.update', report.id),
      {
        _method: 'put', // This is the correct way to tunnel a PUT request with files
        results: inspectionResults,
      },
      {
        onFinish: () => setIsSubmitting(false), // Reset submitting state on finish
      },
    );
  };
  const handleCancelInspection = () => {
    // This will send the DELETE request to the server.
    // Inertia will automatically follow the redirect to the start page.
    router.delete(route('inspections.destroy', report.id));
  };
  // Define the breadcrumbs for this page
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Inspections',
      href: route('inspections.start'),
    },
    {
      title: machine.name,
      href: route('inspections.perform', machine.id),
      isCurrent: true,
    },
  ];

  const totalInspectionPoints =
    machine.subsystems?.reduce((acc, sub) => {
      return acc + (sub.inspection_points?.length ?? 0);
    }, 0) ?? 0;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Inspecting: ${machine.name}`} />

      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daily Inspection</h1>
            <p className="text-muted-foreground">Please complete the checklist below.</p>
          </div>
        </div>

        {/* Summary card */}
        <Card className="flex h-fit w-full flex-col space-y-3 drop-shadow-lg  p-3 shadow-lg md:h-64 md:flex-row md:space-y-0 md:space-x-5">
          {/* Image */}
          <div className="flex h-full w-full items-center justify-center md:w-1/3">
            <img
              src={machine.image_url || 'https://placehold.co/500x500?text=No+Image'}
              alt={`Image of ${machine.name}`}
              className="h-full max-h-58 w-full rounded-xl object-cover"
            />
          </div>

          {/* Info Content */}
          <CardContent className="flex w-full flex-col justify-between p-3 md:w-2/3">
            {/* Top Row Stats */}
            <div className="item-center flex justify-between">
              <div className="flex items-center gap-1">
                <Wrench className="text-primary" />
                <p className="ml-1 text-xl font-bold text-gray-600">{machine.subsystems.length} subsystems</p>
              </div>

              <div className="flex items-center gap-1">
                <ListCheck className="text-primary" />
                <p className="ml-1 text-xl font-bold text-gray-600">{totalInspectionPoints} inspection points</p>
              </div>

              <Badge className="px-6 py-1 text-sm font-medium">
                <p className="flex items-center gap-2">
                  <ClockArrowUp className="h-4 w-4" />
                  {uptime.duration ? (
                    <>
                      <span>Uptime:</span>
                      {uptime.duration}
                    </>
                  ) : (
                    'Not in service'
                  )}
                </p>
              </Badge>
            </div>

            {/* Title */}
            <CardTitle className="text-xl font-black text-foreground md:text-3xl">{machine.name}</CardTitle>

            {/* Description */}
            <p className="line-clamp-3 text-base text-gray-500 md:text-lg">{machine.description || 'No description provided.'}</p>

            {/* Last Inspected */}
            <p className="flex items-center gap-2 text-xl font-bold">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="ml-2 line-clamp-1 text-sm text-muted-foreground">Last Inspected: N/A</span>
            </p>
          </CardContent>
        </Card>

        {/* Checlist card */}
        <Card className="border-white shadow-lg drop-shadow-lg">
          <CardHeader>
            <CardTitle>Inspection Checklist</CardTitle>
            <CardDescription>Please review each point and select the appropriate status.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* --- Removed defaultValue and added spacing --- */}
            <Accordion type="single" collapsible className="w-full space-y-4">
              {machine.subsystems.map((subsystem) => (
                <AccordionItem className='' key={subsystem.id} value={`subsystem-${subsystem.id}`}>
                  {/* --- Added styling for open/closed state --- */}
                  <AccordionTrigger className="rounded-md bg-muted/50 px-4 text-lg font-medium hover:bg-primary hover:text-primary-foreground hover:no-underline data-[state=open]:bg-primary data-[state=open]:text-primary-foreground">
                    {subsystem.name}
                  </AccordionTrigger>
                  <AccordionContent className=''>
                    <div className="space-y-1 rounded-b-md border-x border-b p-2 drop-shadow-lg shadow-lg">
                      {subsystem.inspection_points.map((point) => (
                        <InspectionPointRow
                          key={point.id}
                          point={point}
                          statuses={inspectionStatuses}
                          selectedValue={inspectionResults[point.id]?.status_id}
                          onChange={(statusId) => handleStatusChange(point.id, statusId)}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Action buttons at the bottom */}
        <div className="flex justify-end space-x-4 ">
          <Button className='drop-shadow-lg shadow-lg' variant="secondary" onClick={() => setIsCancelDialogOpen(true)}>
            <CircleX/>
            Cancel
          </Button>
          <Button className='drop-shadow-lg shadow-lg' onClick={handleSubmitInspection} disabled={isSubmitting}>
            <Send/>
            {isSubmitting ? 'Submitting...' : 'Submit Inspection'}
          </Button>
        </div>
      </div>
      <ReportProblemModal isOpen={isReportModalOpen} onOpenChange={setIsReportModalOpen} onSave={handleSaveProblem} point={pointToReport} />
      <ConfirmDeleteDialog
        isOpen={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        onConfirm={handleCancelInspection}
        title="Cancel Inspection?"
        description="Are you sure you want to cancel? All progress on this inspection will be permanently deleted."
      />
    </AppLayout>
  );
}
