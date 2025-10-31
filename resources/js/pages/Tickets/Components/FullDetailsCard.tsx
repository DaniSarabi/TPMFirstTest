import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageViewerModal } from '@/components/ui/image-viewer-modal';
import { Ticket } from '@/types/ticket';
import { Link } from '@inertiajs/react';
import { Download, Eye, FileText, Flag, Image, ListChecks, Wrench } from 'lucide-react';
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

  return (
    <>
      <Card className="overflow-hidden border-0 shadow-lg drop-shadow-lg">
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
        </CardHeader>
        
        {/* --- CAMBIO PRINCIPAL: Layout de 2 columnas --- */}
        <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* --- COLUMNA IZQUIERDA (Tu contenido viejo) --- */}
          <div className="space-y-4">
            {/* --- Image and Main Info --- */}
            <div className="flex flex-col gap-4 sm:flex-row">
              {imageUrl && (
                <div className="relative h-48 w-full shrink-0 sm:w-48">
                  <img src={imageUrl} alt="Inspection photo" className="h-full w-full rounded-md object-cover" />
                  <Button size="sm" className="absolute right-2 bottom-2" onClick={() => setIsImageViewerOpen(true)}>
                    <Image className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{ticket.title}</h3>
                <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
                  <FileText className="mt-1 h-4 w-4 shrink-0" />
                  <p className="text-muted-foreground">{ticket.description || 'No description provided.'}</p>
                </div>
              </div>
            </div>

            {/* --- Location & Context --- */}
            <div className="space-y-2 rounded-md bg-muted p-4 drop-shadow-lg">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <span className="font-semibold">Machine:</span>
                <h2 className="truncate leading-snug font-extrabold" title={machineName}>
                  {machineName}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <span className="font-semibold">Subsystem:</span>
                <span>{ticket.inspection_item?.point.subsystem.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-primary" />
                <span className="font-semibold">Inspection Point:</span>
                <span>{ticket.inspection_item?.point.name}</span>
              </div>
              {ticket.inspection_item?.point.description && (
                <div className="mt-2 flex items-start gap-2 border-t border-primary pt-2">
                  <FileText className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground italic">"{ticket.inspection_item.point.description}"</p>
                </div>
              )}
            </div>

            {/* --- Actions --- */}
            <div className="flex items-center justify-end gap-2 pt-2">
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
          </div>

          {/* --- COLUMNA DERECHA (Nuevos componentes) --- */}
          <div className="space-y-4">

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