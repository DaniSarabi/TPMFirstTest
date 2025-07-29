import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, GitCommitVertical, MessageSquare, Terminal } from 'lucide-react';
import { Ticket, TicketUpdate } from '../Columns';

interface ActivityLogCardProps {
  ticket: Ticket;
}
// A helper component to render the correct icon for each activity type
const ActivityIcon = ({ update }: { update: TicketUpdate }) => {
  if (update.comment?.startsWith('Ping:')) {
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  }
  if (update.comment?.startsWith('System:')) {
    return <Terminal className="h-4 w-4 text-muted-foreground" />;
  }
  if (update.old_status || update.new_status) {
    return <GitCommitVertical className="h-4 w-4 text-muted-foreground" />;
  }
  return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
};

export function ActivityLogCard({ ticket }: ActivityLogCardProps) {
  // Filter for system-generated events (status changes, pings, etc.)
  const activities = ticket.updates.filter(
    (update) => update.old_status || update.new_status || update.comment?.startsWith('Ping:') || update.comment?.startsWith('System:'),
  );
  console.log('Actividades', activities);
  return (
    <Card className='drop-shadow-lg shadow-lg hover:-translate-1 ease-in-out transition-transform transition-500'>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <ol className="relative border-s-2 border-secondary/20 ">
            {activities.map((update, index) => (
              <li key={update.id} className={index === activities.length - 1 ? 'ms-6' : 'ms-6 mb-10'}>
                <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary/80 ring-6 ring-primary/30">
                  <ActivityIcon update={update} />
                </span>
                <div className="items-center justify-between sm:flex ">
                  <p className="text-sm font-semibold text-foreground">{update.comment?.startsWith('System:') ? 'System' : update.user.name}</p>
                  <time className="mb-1 text-xs font-normal text-muted-foreground sm:order-last sm:mb-0">
                    {new Date(update.created_at).toLocaleString()}
                  </time>
                </div>
                <div className="mt-1 rounded-md bg-muted/50 p-2 text-sm text-muted-foreground">
                  {/* Handle the "Created" case */}
                  {!update.old_status && update.new_status && (
                    <>
                      Created the ticket and set status to{' '}
                      <Badge style={{ backgroundColor: update.new_status.bg_color, color: update.new_status.text_color }}>
                        {update.new_status.name}
                      </Badge>
                    </>
                  )}
                  {/* Handle a normal status change */}
                  {update.old_status && update.new_status && (
                    <>
                      Changed status from <Badge variant="outline">{update.old_status.name}</Badge> to{' '}
                      <Badge style={{ backgroundColor: update.new_status.bg_color, color: update.new_status.text_color }}>
                        {update.new_status.name}
                      </Badge>
                    </>
                  )}
                  {/* Handle a machine status change */}
                  {update.new_machine_status && (
                    <>
                      Set machine status to{' '}
                      <Badge style={{ backgroundColor: update.new_machine_status.bg_color, color: update.new_machine_status.text_color }}>
                        {update.new_machine_status.name}
                      </Badge>
                    </>
                  )}
                  {/* Handle a ping */}
                  {update.comment?.startsWith('Ping:') && 'Pinged this ticket: Issue was reported again.'}
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
