import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import * as React from 'react';
import { Ticket } from '@/pages/Tickets/Columns';
import { TicketMiniCard } from './TicketMiniCard';

// Define the props for the modal
interface ExistingTicketsModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onPing: (ticketId: number) => void;
    onReportNew: () => void;
    openTickets: Ticket[];
}

export function ExistingTicketsModal({
    isOpen,
    onOpenChange,
    onPing,
    onReportNew,
    openTickets,
}: ExistingTicketsModalProps) {

    const handlePing = (ticketId: number) => {
        onPing(ticketId);
        onOpenChange(false);
    };

    const handleReportNew = () => {
        onReportNew();
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Existing Issues Found</DialogTitle>
                    <DialogDescription>
                        There are already open tickets for this inspection point. Is the problem you found one of these, or is it something new?
                    </DialogDescription>
                </DialogHeader>
                
                <div className="p-4">
                    <Carousel
                        opts={{
                            align: "start",
                        }}
                        className="w-full"
                    >
                        <CarouselContent>
                            {openTickets.map((ticket) => (
                                <CarouselItem key={ticket.id} className="md:basis-1/2 lg:basis-1/3">
                                    <div className="p-1">
                                       <TicketMiniCard ticket={ticket} onClick={() => handlePing(ticket.id)} />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleReportNew}>
                        Report a New Problem
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
