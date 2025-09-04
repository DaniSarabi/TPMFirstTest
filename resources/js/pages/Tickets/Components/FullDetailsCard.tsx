import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageViewerModal } from '@/components/ui/image-viewer-modal';
import { Ticket } from '@/types/ticket';
import { Link } from '@inertiajs/react';
import { Download, FileText, Flag, Image, ListChecks, View, Wrench, Eye } from 'lucide-react';
import * as React from 'react';

interface FullDetailsCardProps {
  ticket: Ticket;
}

export function FullDetailsCard({ ticket }: FullDetailsCardProps) {
  const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false);
  const imageUrl = ticket.inspection_item?.image_url;
  const inspectionReportId = ticket.inspection_item?.inspection_report_id;

  return (
    <>
      <Card className="overflow-hidden border-0 shadow-lg drop-shadow-lg transition-transform ease-in-out hover:-translate-y-1">
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <div className="space-y-2 rounded-md border p-4 shadow-lg drop-shadow-lg">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Machine:</span>
              <span>{ticket.machine.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Subsystem:</span>
              <span>{ticket.inspection_item?.point.subsystem.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Inspection Point:</span>
              <span>{ticket.inspection_item?.point.name}</span>
            </div>
            {/* ---  inspection point's description --- */}
            {ticket.inspection_item?.point.description && (
              <div className="mt-2 flex items-start gap-2 border-t pt-2">
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
                View Full Inspection Report</Link>
              </Button>
            )}
            <Button className='hover:bg-secondary hover:text-secondary-foreground' variant={'default'} asChild>
              <a href={route('tickets.pdf', ticket.id)} target="_blank">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </a>
            </Button>
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
