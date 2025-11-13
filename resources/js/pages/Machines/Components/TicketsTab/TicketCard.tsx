import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/user-avatar';
import { getCategoryBadgeClass } from '@/lib/tpm-helpers';
import { cn } from '@/lib/utils';
import { User as GlobalUserType } from '@/types'; // ACTION: Importar el tipo de usuario global
import { Ticket } from '@/types/ticket';
import { Link } from '@inertiajs/react';
import { format, isValid } from 'date-fns';
import { AlertTriangle, MessageSquare, Tag } from 'lucide-react';
import * as React from 'react';

// --- Helper de Insignias ---
const InfoBadge = ({ icon, text, className }: { icon: React.ElementType; text: string; className?: string }) => (
  <Badge variant="secondary" className={cn('flex items-center gap-1.5 text-xs', className)}>
    {React.createElement(icon, { className: 'h-3 w-3' })}
    <span>{text}</span>
  </Badge>
);
interface EnrichedTicket extends Ticket {
  solved_by?: GlobalUserType;
}

// --- Componente Principal de la Tarjeta ---
export function TicketCard({ ticket }: { ticket: EnrichedTicket }) {
  const createdDate = new Date(ticket.created_at);
  const dateText = isValid(createdDate) ? format(createdDate, 'PPP') : 'N/A';
  const isClosed = ticket.status.behaviors?.some((b) => ['is_ticket_closing_status', 'is_ticket_discard_status'].includes(b.name));

  const closingUpdate = isClosed ? ticket.updates.find((u) => u.new_status?.id === ticket.status.id) : null;
  const solvedDate = closingUpdate?.created_at ? new Date(closingUpdate.created_at) : null;
  const solvedDateText = solvedDate && isValid(solvedDate) ? format(solvedDate, 'PPP') : null;

  console.log(`Ticket #${ticket.id}:`, {
    isClosed_value: isClosed,
    behaviors_data: ticket.status.behaviors,
    closingUpdate: closingUpdate,
    solvedDate: solvedDate,
    solvedDateText: solvedDateText,
  });

  return (
    <Link
      href={route('tickets.show', ticket.id)}
      className="group block h-full max-h-[250px] rounded-lg  bg-card text-card-foreground shadow-lg transition-all hover:border-primary hover:shadow-lg hover:bg-accent hover:drop-shadow-lg"
    >
      <div className="flex h-full">
        {/* Columna de la Imagen */}
        <div className="hidden w-1/3 overflow-hidden rounded-l-lg border-r md:block">
          <img
            src={ticket.inspection_item?.image_url || 'https://placehold.co/400x400/e2e8f0/64748b?text=No+Image'}
            alt={`Ticket for ${ticket.title}`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>

        {/* Columna de Contenido */}
        <div className="flex w-full flex-col p-4 md:w-2/3">
          <div className="flex-1 space-y-2">
            {/* Fila Superior: Insignias */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge style={{ backgroundColor: ticket.status.bg_color, color: ticket.status.text_color }} className="text-xs capitalize">
                {ticket.status.name}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                #{ticket.id}
              </Badge>
              <InfoBadge
                icon={AlertTriangle}
                text={ticket.priority === 2 ? 'High Priority' : 'Medium Priority'}
                className={ticket.priority === 2 ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/40 text-yellow-800'}
              />
              {ticket.resolution_category && isClosed && (
                <InfoBadge icon={Tag} text={ticket.resolution_category} className={getCategoryBadgeClass(ticket.resolution_category)} />
              )}
            </div>

            {/* Título y Descripción */}
            <h3 className="line-clamp-2 pt-1 font-semibold text-foreground">{ticket.title}</h3>
            {ticket.description && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground italic">
                <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
                <p className="line-clamp-2">"{ticket.description}"</p>
              </div>
            )}
          </div>

          {/* Pie de la Tarjeta: Avatares */}
          <div className="mt-4 space-y-2 border-t-2 border-primary  pt-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span>Reported by:</span>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <UserAvatar user={ticket.creator} className="h-6 w-6" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{ticket.creator.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="font-medium text-foreground">{dateText}</span>
              </div>
            </div>

            {ticket.solved_by && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Solved by:</span>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <UserAvatar user={ticket.solved_by} className="h-6 w-6" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{ticket.solved_by.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="font-medium text-green-600">{solvedDateText}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
