import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { InspectionReport, InspectionStatus } from '@/types/inspection';
import { InspectionPoint } from '@/types/machine';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { CircleX, Send } from 'lucide-react';
import * as React from 'react';
import { CameraModal } from '../../components/CameraModal';
import { Ticket } from '../Tickets/Columns';
import { ChecklistCard } from './Components/CheckListCard';
import { ExistingTicketsModal } from './Components/ExistingTicketsModal';
import { InspectionResult } from './Components/InspectionPointRow';
import { SummaryCard } from './Components/SummaryCard';
// --- Type Definitions for this page ---

interface PerformPageProps {
  report: InspectionReport;
  inspectionStatuses: InspectionStatus[];
  uptime: {
    since: string | null;
    duration: string | null;
  };
  stats: any;
}

export default function Perform({ report, inspectionStatuses, uptime, stats }: PerformPageProps) {
  const { machine } = report;
  const { errors } = usePage().props;

  const [inspectionResults, setInspectionResults] = React.useState<Record<number, InspectionResult>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isExistingTicketsModalOpen, setIsExistingTicketsModalOpen] = React.useState(false);
  const [openTicketsForPoint, setOpenTicketsForPoint] = React.useState<Ticket[]>([]);
  const [pointToReport, setPointToReport] = React.useState<InspectionPoint | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = React.useState(false);
  const [pointToPhotograph, setPointToPhotograph] = React.useState<InspectionPoint | null>(null);

  const handleResultChange = (pointId: number, newResult: InspectionResult) => {
    setInspectionResults((prev) => ({ ...prev, [pointId]: newResult }));
  };

  const handleStatusChange = async (pointId: number, statusId: number) => {
    const newResult = { ...inspectionResults[pointId], status_id: statusId };
    handleResultChange(pointId, newResult);

    const selectedStatus = inspectionStatuses.find((s) => s.id === statusId);
    if (selectedStatus && selectedStatus.severity > 0) {
      const point = machine.subsystems.flatMap((sub) => sub.inspection_points).find((p) => p.id === pointId);
      if (point) {
        try {
          const response = await axios.get<Ticket[]>(route('inspection-points.open-tickets', point.id));
          if (response.data.length > 0) {
            setOpenTicketsForPoint(response.data);
            setPointToReport(point);
            setIsExistingTicketsModalOpen(true);
          }
        } catch (error) {
          console.error('Failed to fetch open tickets:', error);
        }
      }
    }
  };

  const handlePingTicket = (ticketToPing: Ticket) => {
    if (!pointToReport) return;
    handleResultChange(pointToReport.id, {
      ...inspectionResults[pointToReport.id],
      pinged_ticket_id: ticketToPing.id,
      comment: `Ping to existing Ticket #${ticketToPing.id}.`,
      image: null,
    });
  };

  const handleTakePhoto = (point: InspectionPoint) => {
    setPointToPhotograph(point);
    setIsCameraModalOpen(true);
  };

  // ---  Create the handler for when a photo is captured ---
  const handleCapturePhoto = (file: File) => {
    if (pointToPhotograph) {
      handleResultChange(pointToPhotograph.id, {
        ...inspectionResults[pointToPhotograph.id],
        image: file,
      });
    }
  };

  const handleSubmitInspection = () => {
    // Client-side validation before submitting
    for (const point of machine.subsystems.flatMap((s) => s.inspection_points)) {
      const result = inspectionResults[point.id];
      if (!result?.status_id) {
        alert(`Please select a status for all inspection points. Missing status for: ${point.name}`);
        return;
      }
      if (!result.pinged_ticket_id && !result.image) {
        alert(`A photo is required for all inspection points. Missing photo for: ${point.name}`);
        return;
      }
      const selectedStatus = inspectionStatuses.find((s) => s.id === result.status_id);
      if (selectedStatus && selectedStatus.severity > 0 && !result.comment) {
        alert(`A comment is required for points with issues. Missing comment for: ${point.name}`);
        return;
      }
    }

    setIsSubmitting(true);
    router.post(
      route('inspections.update', report.id),
      {
        _method: 'put',
        results: inspectionResults,
      },
      {
        onFinish: () => setIsSubmitting(false),
      },
    );
  };

  return (
    <AppLayout breadcrumbs={[]}>
      <Head title={`Inspecting: ${machine.name}`} />

      <div className="space-y-6 p-6">
        <SummaryCard machine={machine} uptime={uptime} stats={stats} />

        <ChecklistCard
          machine={machine}
          errors={errors}
          inspectionStatuses={inspectionStatuses}
          inspectionResults={inspectionResults}
          onResultChange={handleResultChange}
          onStatusChange={handleStatusChange}
          onTakePhoto={handleTakePhoto}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="secondary" className="hover:bg-destructive hover:text-destructive-foreground">
            <CircleX />
            Cancel
          </Button>
          <Button onClick={handleSubmitInspection} disabled={isSubmitting}>
            <Send />
            {isSubmitting ? 'Submitting...' : 'Submit Inspection'}
          </Button>
        </div>
      </div>

      <ExistingTicketsModal
        isOpen={isExistingTicketsModalOpen}
        onOpenChange={setIsExistingTicketsModalOpen}
        onPing={handlePingTicket}
        onReportNew={() => {}}
        openTickets={openTicketsForPoint}
      />
      <CameraModal isOpen={isCameraModalOpen} onOpenChange={setIsCameraModalOpen} onCapture={handleCapturePhoto} />
    </AppLayout>
  );
}
