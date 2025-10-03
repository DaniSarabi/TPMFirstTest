import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import { Ticket } from '@/types/ticket';
import { Link } from '@inertiajs/react';

interface TicketMiniCardProps {
  ticket: Ticket & { is_machine_deleted?: boolean };
}

export function TicketMiniCard({ ticket }: TicketMiniCardProps) {
  // Determine the correct image to display, prioritizing the inspection photo
  const imageUrl = ticket.inspection_item?.image_url || ticket.machine.image_url || 'https://placehold.co/300x200?text=No+Image';
  const machineName = ticket.machine?.name || 'Deleted Machine';

  return (
    <Link href={route('tickets.show', ticket.id)}>
      <Card className="flex h-full w-full flex-col overflow-hidden border-0 p-0 shadow-md drop-shadow-lg transition-transform ease-in-out hover:-translate-y-1 hover:bg-accent">
        <div className="relative h-32 w-full">
          <img src={imageUrl} alt={ticket.description?.toString() || 'No description provided.'} className="h-full w-full object-cover" />
          <div className="absolute top-2 left-2 flex items-center gap-2">
            <Badge className="bg-gray-900/60 backdrop-blur-sm" variant="secondary">
              #{ticket.id}
            </Badge>
            <Badge style={{ backgroundColor: ticket.status.bg_color, color: ticket.status.text_color }} className="text-white">
              {ticket.status.name}
            </Badge>
          </div>
        </div>
        <CardContent className="flex flex-col p-4 pt-2">
          <p className="mb-2 line-clamp-2 text-sm font-semibold">{ticket.description || 'No description provided.'}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">{ticket.title}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">{machineName}</p>
          <div className="mt-auto flex items-center gap-2 pt-2">
            <UserAvatar user={ticket.creator} className="h-6 w-6" />
            <span className="text-xs text-muted-foreground">{ticket.creator.name}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
