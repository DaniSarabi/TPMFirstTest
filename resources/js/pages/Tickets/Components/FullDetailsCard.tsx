import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageViewerModal } from '@/components/ui/image-viewer-modal';
import { Ticket } from '@/types/ticket';
import { Link } from '@inertiajs/react';
import { Archive, Eye, FileText, Flag, Image, ListChecks, Wrench } from 'lucide-react';
import * as React from 'react';
import { AttachmentList } from './AttachmentList';

interface FullDetailsCardProps {
  ticket: Ticket & { is_machine_deleted?: boolean };
}

export function FullDetailsCard({ ticket }: FullDetailsCardProps) {
  const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false);
  const imageUrl = ticket.image_url || ticket.inspection_item?.image_url || ticket.machine?.image_url || 'https://placehold.co/600x400?text=No+Image';
  const inspectionReportId = ticket.inspection_item?.inspection_report_id;
  const machineName = ticket.machine?.name || 'Deleted Machine';

  const pointIsDeleted = ticket.inspection_item?.point?.deleted_at;
  const subsystemIsDeleted = ticket.inspection_item?.point?.subsystem?.deleted_at;
  return (
    <>
      <Card className="overflow-hidden border-0 shadow-lg drop-shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ticket Details</CardTitle>
          <div>
            {inspectionReportId && (
              <Button variant="outline" asChild>
                <Link href={route('inspections.show', inspectionReportId)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Full Inspection Report
                </Link>
              </Button>
            )}
            {/* Tu botón de PDF comentado */}
          </div>
        </CardHeader>

        {/* --- 2 filas --- */}
        <CardContent className="space-y-6">
          <div className="flex flex-row gap-4">
            {/* --- Image and Main Info --- */}
            <div className="flex flex-1 flex-row gap-4 sm:flex-row">
              {imageUrl && (
                <div className="relative h-48 w-full shrink-0 sm:w-48">
                  <img src={imageUrl} alt="Inspection photo" className="hidden h-48 w-full rounded-md object-cover sm:block" />
                  <Button size="sm" className="absolute right-2 bottom-2 hidden sm:flex" onClick={() => setIsImageViewerOpen(true)}>
                    <Image className="mr-2 h-4 w-4" /> View
                  </Button>
                  <Button size="sm" className="w-full sm:hidden" onClick={() => setIsImageViewerOpen(true)}>
                    <Image className="mr-2 h-4 w-4" /> View Photo
                  </Button>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-semibold">Problem description</h3>

                <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
                  <FileText className="mt-1 h-4 w-4 shrink-0" />

                  {/* Desktop text */}
                  <p className="hidden text-muted-foreground sm:block">{ticket.description || 'No description provided.'}</p>
                </div>
              </div>
            </div>
            {/* --- Location & Context --- */}
            <div className="flex-1 space-y-2 rounded-md bg-muted p-4 drop-shadow-lg">
              {/* MACHINE */}
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <span className="hidden font-semibold md:inline">Machine:</span>
                <h2 className="truncate leading-snug font-extrabold" title={machineName}>
                  {machineName}
                </h2>
              </div>

              {/* SUBSYSTEM */}
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <span className="hidden font-semibold md:inline">Subsystem:</span>
                <span>{ticket.inspection_item?.point.subsystem?.name || 'N/A'}</span>

                {subsystemIsDeleted && (
                  <span className="ml-2 flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    <Archive className="h-3 w-3" /> Archived
                  </span>
                )}
              </div>

              {/* INSPECTION POINT */}
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-primary" />
                <span className="hidden font-semibold md:inline">Inspection Point:</span>
                <span>{ticket.inspection_item?.point?.name || 'N/A'}</span>

                {pointIsDeleted && !subsystemIsDeleted && (
                  <span className="ml-2 flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    <Archive className="h-3 w-3" /> Archived
                  </span>
                )}
              </div>

              {/* DESCRIPTION */}
              {ticket.inspection_item?.point?.description && (
                <div className="mt-2 flex items-start gap-2 border-t border-primary pt-2">
                  <FileText className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground italic">"{ticket.inspection_item.point.description}"</p>
                </div>
              )}
            </div>
          </div>
          {/* --- FILA 2 (Componente de Adjuntos) --- */}
          <div className="space-y-4 border-0 shadow-none">
            <AttachmentList ticket={ticket} />
          </div>
        </CardContent>
      </Card>

      <ImageViewerModal
        isOpen={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
        imageUrl={imageUrl || ''}
        imageAlt={`Photo for ticket #${ticket.id}`}
      />
    </>
  );
}
