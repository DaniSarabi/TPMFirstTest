import { Badge } from '@/components/ui/badge';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/user-avatar';
import { Ticket } from '@/types/ticket';
import { Link } from '@inertiajs/react';
import { AlertTriangle, Clock, FileText, ShieldAlert, Wrench } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket & { pings_count: number };
}

export function TicketCard({ ticket }: TicketCardProps) {
  // ACTION: La lógica para determinar el icono, color y texto de la prioridad se mueve aquí.
  const priorityDetails = (() => {
    if (ticket.priority === 2) {
      // High priority
      return {
        icon: <ShieldAlert className="h-5 w-5 text-white" />,
        bgColor: 'bg-red-500/60',
        text: 'Critical',
      };
    }
    // Medium priority (default)
    return {
      icon: <AlertTriangle className="h-5 w-5 text-white" />,
      bgColor: 'bg-yellow-500/60',
      text: 'Needed',
    };
  })();

  const imageUrl = ticket.image_url || ticket.inspection_item?.image_url || ticket.machine.image_url || 'https://placehold.co/600x400?text=No+Image';

  const dateOpened = new Date(ticket.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const pingCount = ticket.pings_count;

  return (
    <Link
      href={route('tickets.show', ticket.id)}
      className="relative block w-full transform transition-transform duration-300 ease-in-out hover:-translate-y-3"
    >
      <div className="flex h-full flex-col rounded-lg bg-card p-4 shadow-md drop-shadow-lg hover:bg-accent hover:shadow-lg">
        {/* ACTION: Se adopta la estructura de la imagen de MachineCard */}
        <div className="relative h-52 w-full justify-center overflow-hidden rounded-lg shadow-sm shadow-primary drop-shadow-lg">
          <div className="relative h-52 w-full overflow-hidden rounded-lg">
            <img src={imageUrl} alt={ticket.machine.name} className="h-full w-full object-cover" />
          </div>
          {/* Badges en la esquina superior izquierda */}
          <div className="absolute top-2 left-2 z-10 flex flex-row items-start gap-1">
            <Badge variant="default">#{ticket.id}</Badge>
            <Badge style={{ backgroundColor: ticket.status.bg_color, color: ticket.status.text_color }}>{ticket.status.name}</Badge>
          </div>{' '}
          {pingCount > 0 && (
            <div className="absolute top-2 right-2 z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-white shadow-lg">
                      {/* La animación "waving" (pulso) */}
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-500 opacity-75"></span>
                      {/* El número, en una capa relativa para que quede por encima */}
                      <span className="relative inline-flex h-full w-full items-center justify-center rounded-full text-sm font-bold">
                        {pingCount}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      This issue has been reported {pingCount} {pingCount > 1 ? 'times' : 'time'} before.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          {/* ACTION: Se reemplaza la barra de estado por el "Stats Overlay" */}
          <div className="absolute bottom-0 mb-3 flex w-full justify-center">
            <div
              className={`flex items-center space-x-2 overflow-hidden rounded-lg ${priorityDetails.bgColor} px-4 py-1 text-white shadow backdrop-blur-sm`}
            >
              {priorityDetails.icon}
              <span className="font-medium">{priorityDetails.text}</span>
            </div>
          </div>
        </div>

        {/* Contenido de la tarjeta (se mantiene la lógica) */}
        <div className="flex flex-grow flex-col pt-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="line-clamp-2 min-h-[3.5rem] text-lg font-semibold" title={ticket.title}>
              {ticket.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-grow space-y-2 p-0 text-sm text-muted-foreground">
            <div className="flex min-h-[2.5rem] items-start gap-2">
              <FileText className="mt-0.5 h-5 w-5 shrink-0" />
              <span className="line-clamp-2">{ticket.description || 'No description provided.'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 shrink-0" />
              <span className="line-clamp-1">{ticket.machine.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 shrink-0" />
              <span>Reported: {dateOpened}</span>
            </div>
            <Separator className="my-2 border-1 border-primary" />
            <div className="flex items-center pt-1">
              <UserAvatar user={ticket.creator} className="h-8 w-8" />
              <span className="px-2 font-medium text-foreground">{ticket.creator.name}</span>
            </div>
          </CardContent>
        </div>
      </div>
    </Link>
  );
}
