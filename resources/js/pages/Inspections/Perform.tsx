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
    // Ya no necesitamos la validación de 'alert()' aquí,
    // porque el botón estará deshabilitado si algo falta.
    setIsSubmitting(true);
    router.post(route('inspections.update', report.id), { _method: 'put', results: inspectionResults }, { onFinish: () => setIsSubmitting(false) });
  };

  const { completedPoints, totalPoints, progressPercentage, isSubmitDisabled, pointsStatus } = React.useMemo(() => {
    const isPointComplete = (point: InspectionPoint, result: InspectionResult | undefined): boolean => {
      if (!result?.status_id) return false; // 1. ¿Tiene estatus?

      const selectedStatus = inspectionStatuses.find((s) => s.id === result.status_id);
      if (!selectedStatus) return false;

      // Si el ticket fue "pingeado", no requiere ni foto ni comentario
      if (result.pinged_ticket_id) return true;

      // Lógica de Foto (siempre requerida si no es ping)
      if (!result.image) return false; // 2. ¿Tiene foto?

      // Lógica de Comentario (solo si es grave)
      if (selectedStatus.severity > 0 && (!result.comment || result.comment.trim() === '')) {
        return false; // 3. ¿Es grave Y no tiene comentario?
      }

      return true; // ¡Si pasó todo, está completa!
    };

    const allPoints = machine.subsystems.flatMap((s) => s.inspection_points);
    let completedCount = 0;

    // Un mapa para saber el estado de cada punto
    const pointsStatus = new Map<number, boolean>();

    allPoints.forEach((point) => {
      const result = inspectionResults[point.id];
      const isComplete = isPointComplete(point, result);
      pointsStatus.set(point.id, isComplete);
      if (isComplete) {
        completedCount++;
      }
    });

    const total = allPoints.length;
    const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return {
      completedPoints: completedCount,
      totalPoints: total,
      progressPercentage: percentage,
      isSubmitDisabled: completedCount !== total, // Deshabilitado si no está al 100%
      pointsStatus: pointsStatus, // El mapa de (point.id -> true/false)
    };
  }, [machine.subsystems, inspectionResults, inspectionStatuses]);
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
          pointsStatus={pointsStatus}
          completedPoints={completedPoints}
          totalPoints={totalPoints}
          progressPercentage={progressPercentage}
          onResultChange={handleResultChange}
          onStatusChange={handleStatusChange}
          onTakePhoto={handleTakePhoto}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="secondary" className="hover:bg-destructive hover:text-destructive-foreground">
            <CircleX />
            Cancel
          </Button>
          <Button onClick={handleSubmitInspection} disabled={isSubmitDisabled || isSubmitting}>
            <Send />
            {isSubmitting ? 'Submitting...' : 'Submit Inspection'}
          </Button>
        </div>
        {isSubmitDisabled && <p className="text-right text-sm text-red-600">* Please complete all required fields before submitting.</p>}
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
