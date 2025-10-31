import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, TicketUpdate } from '@/types/ticket';
import {
  AlertTriangle,
  FileUp, // <-- Añadido
  FileX, // <-- Añadido
  GitCommitVertical,
  Mail,
  Megaphone,
  MessageSquare,
  Terminal,
} from 'lucide-react';

interface ActivityLogCardProps {
  ticket: Ticket;
}

// A helper component to render the correct icon for each activity type
const ActivityIcon = ({ update }: { update: TicketUpdate }) => {
  // --- COMENTADO POR REQUERIMIENTO ---
  // if (update.loggable_type?.endsWith('Tag')) {
  //   return <TagIcon className="h-4 w-4 text-white" />;
  // }

  // --- NUEVOS EVENTOS DE ADJUNTOS ---
  if (update.action === 'attached') {
    return <FileUp className="h-4 w-4 text-white" />;
  }
  if (update.action === 'detached') {
    return <FileX className="h-4 w-4 text-white" />;
  }
  // --- FIN ---

  if (update.comment?.startsWith('Ping:')) {
    return <AlertTriangle className="h-4 w-4 text-white" />;
  }
  if (update.comment?.startsWith('System:')) {
    return <Terminal className="h-4 w-4 text-white" />;
  }
  if (update.old_status || update.new_status) {
    return <GitCommitVertical className="h-4 w-4 text-white" />;
  }
  if (update.comment?.startsWith('Sent a part request')) {
    return <Mail className="h-4 w-4 text-white" />;
  }
  if (update.action === 'escalated' || update.action === 'downgraded') {
    return <Megaphone className="h-4 w-4 text-white" />;
  }
  return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
};

export function ActivityLogCard({ ticket }: ActivityLogCardProps) {
  // Filter for system-generated events
  const activities = ticket.updates.filter(
    (update) =>
      update.old_status ||
      update.new_status ||
      // update.loggable, // <-- Se quita, ahora filtramos por acciones específicas
      update.comment?.startsWith('Ping:') ||
      update.comment?.startsWith('System:') ||
      update.comment?.startsWith('Sent a part request') ||
      update.action == 'escalated' ||
      update.action == 'downgraded' || // <-- Añadido para consistencia
      // --- NUEVOS EVENTOS ---
      update.action == 'attached' ||
      update.action == 'detached',
  );

  return (
    <Card className="shadow-lg drop-shadow-lg transition-transform ease-in-out hover:-translate-1 lg:flex lg:h-full lg:flex-col lg:overflow-hidden lg:border-0 lg:shadow-none lg:drop-shadow-none">
      {' '}
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-5">
        {activities.length > 0 ? (
          <ol className="relative border-s-2 border-secondary/20">
            {activities
              .slice()
              .reverse()
              .map((update, index) => (
                <li key={update.id} className={index === activities.length - 1 ? 'ms-6' : 'ms-6 mb-10'}>
                  <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary/80 ring-6 ring-primary/30">
                    <ActivityIcon update={update} />
                  </span>
                  <div className="items-center justify-between sm:flex">
                    <p className="text-sm font-semibold text-foreground">{update.comment?.startsWith('System:') ? 'System' : update.user.name}</p>
                    <time className="mb-1 text-xs font-normal text-muted-foreground sm:order-last sm:mb-0">
                      {new Date(update.created_at).toLocaleString()}
                    </time>
                  </div>
                  <div className="mt-1 rounded-md bg-muted/50 p-2 text-sm text-muted-foreground">
                    {/* --- Case 1: A tag was applied or removed (COMENTADO POR REQUERIMIENTO) --- */}
                    {/* {update.loggable && update.loggable_type?.endsWith('Tag') && (
                      <>
                        System {update.action} tag:{' '}
                        <Badge
                          className="inline-flex items-center gap-1.5 text-xs font-semibold"
                          style={{
                            backgroundColor: update.loggable.color,
                            color: getContrastColor(update.loggable.color),
                          }}
                        >
                          <DynamicLucideIcon name={update.loggable.icon} className="h-3 w-3 stroke-3" />
                          <span className="capitalize">{update.loggable.name}</span>
                        </Badge>
                      </>
                    )} */}

                    {/* Case 2: Ticket was created */}
                    {!update.loggable && !update.old_status && update.new_status && (
                      <>
                        Created the ticket and set status to{' '}
                        <Badge style={{ backgroundColor: update.new_status.bg_color, color: update.new_status.text_color }}>
                          {update.new_status.name}
                        </Badge>
                      </>
                    )}

                    {/* Case 3: Ticket status changed */}
                    {!update.loggable && update.old_status && update.new_status && (
                      <>
                        Changed status from{' '}
                        <Badge style={{ backgroundColor: update.old_status.bg_color, color: update.old_status.text_color }}>
                          {update.old_status.name}
                        </Badge>{' '}
                        to{' '}
                        <Badge style={{ backgroundColor: update.new_status.bg_color, color: update.new_status.text_color }}>
                          {update.new_status.name}
                        </Badge>
                      </>
                    )}

                    {/* --- NUEVO: Case 4: Archivos adjuntos --- */}
                    {/* El 'comment' ya viene formateado desde el backend */}
                    {(update.action === 'attached' || update.action === 'detached') && <p>{update.comment}</p>}

                    {/* Case 5: Other comments (Pings, Part Requests, etc.) */}
                    {!update.loggable && update.comment?.startsWith('Ping:') && 'Pinged this ticket: Issue was reported again.'}
                    {!update.loggable && update.comment?.startsWith('Sent a part request') && <p>{update.comment}</p>}
                    {update.action == 'escalated' && <p>Escalated the ticket to High Priority.</p>}
                    {update.action == 'downgraded' && <p>Downgraded the ticket to Medium Priority.</p>}
                  </div>
                </li>
              ))}
          </ol>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
