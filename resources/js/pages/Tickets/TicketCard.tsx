import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { AlertTriangle, Clock, FileText, ShieldAlert, Wrench } from 'lucide-react';
import { Ticket } from './Columns';

interface TicketCardProps {
  ticket: Ticket;
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  const initials = names.map((n) => n[0]).join('');
  return initials.toUpperCase().slice(0, 2);
};

export function TicketCard({ ticket }: TicketCardProps) {
  // Logic for the priority icon
  const PriorityIcon = () => {
    let icon = <AlertTriangle className="h-5 w-5 text-white" />;
    let bgColor = 'bg-yellow-500'; // Medium priority
    let text = 'Needed';

    if (ticket.priority === 2) {
      // High priority
      icon = <ShieldAlert className="h-5 w-5 text-white" />;
      bgColor = 'bg-red-500';
      text = 'Critical';
    }

    return (
      <div className={`flex items-center px-4 py-1 ${bgColor}`}>
        {icon}
        <span className="ml-2 font-medium text-white"> {text} </span>
      </div>
    );
  };

  const imageUrl = ticket.inspection_item?.image_url || ticket.machine.image_url || 'https://placehold.co/600x400?text=No+Image';

  const dateOpened = new Date(ticket.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return (
    <Link
      href={route('tickets.show', ticket.id)}
      className="block w-full transform transition-transform duration-300 ease-in-out hover:-translate-y-3"
    >
      <Card className="flex h-full w-full flex-col overflow-hidden rounded-lg p-0 shadow-md ring-0 border-0 ring-white hover:bg-accent">
        {/* --- Use the dynamic image URL and make it touch the top --- */}
        <div className="relative h-32 w-full">
          <img src={imageUrl} alt={ticket.machine.name} className="h-full w-full object-cover" />
          {/* Badges positioned over the top image */}
          <div className="absolute top-2 left-2 flex items-center gap-2">
            <Badge className="bg-gray-900/60 backdrop-blur-sm" variant="secondary">
              #{ticket.id}
            </Badge>
            <Badge style={{ backgroundColor: ticket.status.bg_color, color: ticket.status.text_color }} className="text-white">
              {ticket.status.name}
            </Badge>
          </div>
          <PriorityIcon />
        </div>

        <CardContent className="flex flex-grow flex-col px-6 pt-4 pb-4">
          <div className=''>
          {/* Title */}
          <p className="mb-2 line-clamp-2 text-lg font-semibold min-h-[3.5rem] max-h-[3.5rem] ">{ticket.title}</p>

          {/* --- Add the ticket description preview --- */}
          <div className="mb-2 flex items-center text-sm text-muted-foreground min-h-[2.5rem]">
            <FileText className="mr-2 h-5 w-5 shrink-0" />
            <span className="line-clamp-2">{ticket.description || 'No description provided.'}</span>
          </div>

          {/* Machine field */}
          <div className="mb-2 flex items-center text-sm text-muted-foreground min-h-[2rem]">
            <Wrench className="mr-2 h-5 w-5 shrink-0" />
            <span className="line-clamp-1">{ticket.machine.name}</span>
          </div>

          {/* Time from open */}
          <div className="mb-3 flex items-center text-sm text-muted-foreground min-h-[1rem]">
            <Clock className="mr-2 h-5 w-5 shrink-0" />
            {/* --- Use the formatted date --- */}
            <span>Reported: {dateOpened}</span>
          </div>


          </div>

          <hr className="my-2" />

          {/* User and Priority Section */}
          <div className="mt-auto flex items-center justify-between pt-2">
            <div className="flex items-center">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{getInitials(ticket.creator.name)}</AvatarFallback>
              </Avatar>
              <span className="px-2 text-sm font-medium text-gray-700">{ticket.creator.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
