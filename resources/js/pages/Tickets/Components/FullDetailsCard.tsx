import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket } from '../Columns';
import * as React from 'react';
import { ImageViewerModal } from '@/components/ui/image-viewer-modal';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface FullDetailsCardProps {
    ticket: Ticket;
}

export function FullDetailsCard({ ticket }: FullDetailsCardProps) {
    const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false);
    const imageUrl = ticket.inspection_item?.image_url;

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Full Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Ticket Title</p>
                        <p className="font-semibold">{ticket.title}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Initial Description</p>
                        <p className="text-foreground whitespace-pre-wrap">{ticket.description || 'No description provided.'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Location</p>
                        <p className="font-semibold">
                            {ticket.machine.name} / {ticket.inspection_item?.point.subsystem.name} / {ticket.inspection_item?.point.name}
                        </p>
                    </div>
                    {imageUrl && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Attached Photo</p>
                            <Button variant="outline" onClick={() => setIsImageViewerOpen(true)}>
                                <Camera className="mr-2 h-4 w-4" />
                                View Photo
                            </Button>
                        </div>
                    )}
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
