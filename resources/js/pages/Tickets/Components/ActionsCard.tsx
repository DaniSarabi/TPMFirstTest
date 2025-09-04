import { Button } from '@/components/ui/button';
import { EmailContact } from '@/types';
import { Ticket, TicketStatus } from '@/types/ticket';
import { router } from '@inertiajs/react';
import { BookmarkCheck, Mail, Play } from 'lucide-react';
import * as React from 'react';
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

  // We create easy-to-read boolean flags based on the behaviors of the current status.
  const statusBehaviors = ticket.status.behaviors || [];
  const isOpeningStatus = statusBehaviors.some((b) => b.name === 'is_opening_status');
  const isInProgressStatus = statusBehaviors.some((b) => b.name === 'is_in_progress_status');
  const isAwaitingPartsStatus = statusBehaviors.some((b) => b.name === 'awaits_critical_parts') || statusBehaviors.some((b) => b.name === 'awaits_non_critical_parts');
  const isClosingStatus = statusBehaviors.some((b) => b.name === 'is_ticket_closing_status');

  const handleStartWork = () => {
    router.patch(
      route('tickets.start-work', ticket.id),
      {},
      {
        preserveScroll: true,
      },
    );
  };

  if (isClosingStatus) {
    return null;
  }

  return (
    <>
      <div className="flex flex-row items-center gap-2">
        {isOpeningStatus && (
          <Button className="w-full flex-1 bg-green-600 transition-all duration-300 hover:-translate-y-1" onClick={handleStartWork}>
            <Play className="mr-2 h-4 w-4" />
            Start Work
          </Button>
        )}

        {isInProgressStatus && (
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
        )}

        {isAwaitingPartsStatus && (
          <Button className="w-full bg-green-600 transition-all duration-300 hover:-translate-y-1" onClick={() => setIsResumeWorkModalOpen(true)}>
            <Play className="mr-2 h-4 w-4" />
            Resume Work
          </Button>
        )}
      </div>

      {/* Modals remain the same */}
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
