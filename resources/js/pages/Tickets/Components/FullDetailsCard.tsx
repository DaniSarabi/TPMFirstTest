import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageViewerModal } from '@/components/ui/image-viewer-modal';
import { Camera, Download, FileText, Flag, Image, ListChecks, Wrench } from 'lucide-react';
import * as React from 'react';
import { Ticket } from '../Columns';
import { Link } from '@inertiajs/react';

interface FullDetailsCardProps {
  ticket: Ticket;
}

export function FullDetailsCard({ ticket }: FullDetailsCardProps) {
    const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false);
    const imageUrl = ticket.inspection_item?.image_url;

    return (
        <>
    <Card className="border-0 overflow-hidden shadow-lg drop-shadow-lg transition-transform ease-in-out hover:-translate-1">
                <CardHeader>
                    <CardTitle>Ticket Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* --- Image and Main Info --- */}
                    <div className="flex flex-col gap-4 sm:flex-row">
                        {imageUrl && (
                            <div className="relative h-48 w-full sm:w-48 shrink-0">
                                <img
                                    src={imageUrl}
                                    alt="Inspection photo"
                                    className="h-full w-full rounded-md object-cover"
                                />
                                <Button
                                    size="sm"
                                    className="absolute bottom-2 right-2"
                                    onClick={() => setIsImageViewerOpen(true)}
                                >
                                    <Image className="mr-2 h-4 w-4" />
                                    View
                                </Button>
                            </div>
                        )}
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">{ticket.title}</h3>
                            <div className='flex items-center gap-2 bg-muted rounded-lg px-4 '>
                            <FileText className="h-4 w-4 " />
                            <p className="text-muted-foreground">{ticket.description || 'No description provided.'}</p>
                            </div>
                        </div>
                    </div>

                    {/* --- Location & Context --- */}
                    <div className="space-y-2 rounded-md border p-4 drop-shadow-lg shadow-lg">
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
                    </div>
                    
                    {/* --- Actions --- */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button variant="outline" asChild>
                            <Link href="#">
                                View Full Inspection Report
                            </Link>
                        </Button>
                        <Button asChild>
                            <a href="#">
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
