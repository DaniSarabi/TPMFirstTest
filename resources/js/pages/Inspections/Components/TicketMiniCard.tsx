import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import { Ticket } from '@/pages/Tickets/Columns';

interface TicketMiniCardProps {
  ticket: Ticket;
  onClick: () => void;
}

export function TicketMiniCard({ ticket, onClick }: TicketMiniCardProps) {
  const imageUrl = ticket.inspection_item?.image_url || ticket.machine.image_url;

  return (
    <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-lg" onClick={onClick}>
      <CardHeader className="p-4">
        {imageUrl && <img src={imageUrl} alt={ticket.title} className="mb-2 h-24 w-full rounded-md object-cover" />}
        <CardTitle className="line-clamp-2 text-base">{ticket.description}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 p-4 pt-0">
        <UserAvatar user={ticket.creator} className="h-6 w-6" />
        <span className="text-xs text-muted-foreground">{ticket.creator.name}</span>
      </CardContent>
    </Card>
  );
}
