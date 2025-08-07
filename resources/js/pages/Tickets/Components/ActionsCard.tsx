import { Button } from '@/components/ui/button';
import { EmailContact } from '@/pages/GeneralSettings/EmailContacts/Columns';
import { router } from '@inertiajs/react';
import { BookmarkCheck, Mail, Play } from 'lucide-react';
import * as React from 'react';
import { Ticket, TicketStatus } from '../Columns';
import { ChangeStatusModal } from './ChangeStatusModal';
import { CloseTicketModal } from './CloseTicketModal';
import { RequestPartsModal } from './RequestPartsModal';
import { ResumeWorkModal } from './ResumeWorkModal';

interface ActionsCardProps {
  ticket: Ticket;
  statuses: TicketStatus[];
  purchasingContacts: EmailContact[];
}

export function ActionsCard({ ticket, statuses, purchasingContacts }: ActionsCardProps) {
  // State to manage the open/closed state for each of the three modals
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = React.useState(false);
  const [isRequestPartsModalOpen, setIsRequestPartsModalOpen] = React.useState(false);
  const [isCloseTicketModalOpen, setIsCloseTicketModalOpen] = React.useState(false);
  const [isResumeWorkModalOpen, setIsResumeWorkModalOpen] = React.useState(false);
  
  const handleStartWork = () => {
    router.patch(
      route('tickets.start-work', ticket.id),
      {},
      {
        preserveScroll: true,
      },
    );
  };

  const renderActions = () => {
    switch (ticket.status.name) {
      case 'Open':
        return (
          <Button className="w-full flex-1 bg-green-600 transition-all duration-300 hover:-translate-y-1" onClick={handleStartWork}>
            <Play className="mr-2 h-4 w-4" />
            Start Work
          </Button>
        );
      case 'In progress':
        return (
          <>
            <Button
              className="w-full flex-1 transition-all duration-300 hover:-translate-y-1"
              variant="default"
              onClick={() => setIsRequestPartsModalOpen(true)}
            >
              <Mail className="mr-2 h-4 w-4" />
              Request Parts
            </Button>
            <Button
              className="w-full flex-1 transition-all duration-300 hover:-translate-y-1"
              variant="destructive"
              onClick={() => setIsCloseTicketModalOpen(true)}
            >
              <BookmarkCheck className="mr-2 h-4 w-4" />
              Close Ticket
            </Button>
          </>
        );
      case 'Awaiting Parts':
      case 'Awaiting Critical Parts':
        return (
          <Button className="w-full bg-green-600 transition-all duration-300 hover:-translate-y-1" onClick={() => setIsResumeWorkModalOpen(true)}>
            <Play className="mr-2 h-4 w-4" />
            Resume Work
          </Button>
        );
      default:
        // For "Resolved" or other statuses, show no primary actions
        return;
    }
  };

  return (
    <>
      <div className="flex flex-row items-center gap-2">{renderActions()}</div>
      <ChangeStatusModal isOpen={isChangeStatusModalOpen} onOpenChange={setIsChangeStatusModalOpen} ticket={ticket} statuses={statuses} />
      <RequestPartsModal
        isOpen={isRequestPartsModalOpen}
        onOpenChange={setIsRequestPartsModalOpen}
        ticket={ticket}
        purchasingContacts={purchasingContacts}
      />
      <CloseTicketModal isOpen={isCloseTicketModalOpen} onOpenChange={setIsCloseTicketModalOpen} ticket={ticket} />
      <ResumeWorkModal isOpen={isResumeWorkModalOpen} onOpenChange={setIsResumeWorkModalOpen} ticket={ticket} />
    </>
  );
}
