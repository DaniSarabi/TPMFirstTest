import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Ticket } from '../Columns';
import { TicketMiniCard } from './TicketMiniCard';

interface RelatedTicketsCardProps {
  relatedTickets: Ticket[];
}

export function RelatedTicketsCard({ relatedTickets }: RelatedTicketsCardProps) {
  if (relatedTickets.length === 0) {
    return null; // No renderizar nada si no hay tickets relacionados
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg drop-shadow-lg transition-transform ease-in-out hover:-translate-y-1">
      <CardHeader>
        <CardTitle>Related Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <Carousel
          opts={{
            align: 'start',
          }}
          className="w-full"
        >
          <CarouselContent>
            {relatedTickets.map((ticket) => (
              <CarouselItem key={ticket.id} className="pl-5 pr-1 md:basis-1/2 lg:basis-1/3">
                <div className="py-2">
                  <TicketMiniCard ticket={ticket} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="ml-12" />
          <CarouselNext className="mr-12" />
        </Carousel>
      </CardContent>
    </Card>
  );
}
