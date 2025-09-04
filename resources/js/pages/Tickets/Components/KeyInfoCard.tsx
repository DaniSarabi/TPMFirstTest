import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket } from '@/types/ticket';
import { User } from '@/types/user';
import { AlertTriangle, Calendar, CheckCircle, Clock, ShieldAlert, UserIcon } from 'lucide-react';

interface KeyInfoCardProps {
  ticket: Ticket;
  timeOpen: string;
  solvedBy: User | null;
}

export function KeyInfoCard({ ticket, timeOpen, solvedBy }: KeyInfoCardProps) {
  // Helper to determine the priority icon and color
  const PriorityDisplay = () => {
    if (ticket.priority === 2) {
      return (
        <div className="rounded-lg bg-white px-1 py-1  transition-transform ease-in-out hover:-translate-y-1">

        <div className="flex items-center gap-2 rounded-lg bg-red-600 px-3 text-lg text-white shadow-lg drop-shadow-lg ">
          <ShieldAlert className="h-6 w-6" /> High
        </div>
        </div>
      );
    }
    if (ticket.priority === 1) {
      return (
        <div className="rounded-lg bg-white px-1 py-1  transition-transform ease-in-out hover:-translate-y-1">
          <div className="flex items-center gap-2 rounded-lg bg-yellow-500 px-3 text-lg font-bold text-primary-foreground shadow-lg drop-shadow-lg">
            <AlertTriangle className="h-6 w-6" />
            Medium
          </div>
        </div>
      );
    }
    return <span className="text-muted-foreground">Low</span>;
  };

  const creationDate = new Date(ticket.created_at).toLocaleDateString();
  return (
    
    <Card className="border-0 bg-primary text-primary-foreground shadow-lg drop-shadow-lg transition-transform ease-in-out hover:-translate-1">
      <CardContent className="">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-grow">
            <h2 className="truncate text-2xl leading-snug font-extrabold">{ticket.machine.name}</h2>
          </div>
          <div className="flex-shrink-0">
        <div className="rounded-lg bg-white px-1 py-1  transition-transform ease-in-out hover:-translate-y-1">
              <Badge
                className="text-base"
                style={{
                  backgroundColor: ticket.status.bg_color,
                  color: ticket.status.text_color,
                }}
              >
                {ticket.status.name}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-primary-foreground/80 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-7 w-7" />
            <div>
              <p>Created On</p>
              <p className="font-bold text-primary-foreground text-lg">{creationDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-7 w-7" />
            <div>
              <p>Time Open</p>
              <p className="font-bold text-primary-foreground text-lg">{timeOpen}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserIcon className="h-7 w-7" />
            <div>
              <p>Created By</p>
              <p className="font-bold text-primary-foreground text-lg">{ticket.creator.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PriorityDisplay />
          </div>
          {/* --- Conditionally render the "Solved By" field --- */}
          {solvedBy && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-7 w-7" />
              <div>
                <p>Solved By</p>
                <p className="font-bold text-primary-foreground text-lg">{solvedBy.name}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
