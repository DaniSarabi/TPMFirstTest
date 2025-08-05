import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmailContact } from '@/pages/GeneralSettings/EmailContacts/Columns';
import { BookmarkCheck, CheckCircle, Mail } from 'lucide-react';
import * as React from 'react';
import { Ticket, TicketStatus } from '../Columns';
import { ChangeStatusModal } from './ChangeStatusModal';
import { CloseTicketModal } from './CloseTicketModal';
import { RequestPartsModal } from './RequestPartsModal';

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

  return (
    <>
      <Card className="shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-accent border-0 pt-2 pb-2">
        <CardContent className="flex flex-col items-center justify-between gap-3 md:flex-row">
          <div className="flex w-full gap-3">
            <Button className="flex-1" variant="default" onClick={() => setIsChangeStatusModalOpen(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Change Status
            </Button>
            <Button className="flex-1" variant="secondary" onClick={() => setIsRequestPartsModalOpen(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Request Parts
            </Button>
            <Button className="flex-1" variant="destructive" onClick={() => setIsCloseTicketModalOpen(true)}>
              <BookmarkCheck className="mr-2 h-4 w-4" />
              Close Ticket
            </Button>
          </div>
        </CardContent>
      </Card>

      <ChangeStatusModal isOpen={isChangeStatusModalOpen} onOpenChange={setIsChangeStatusModalOpen} ticket={ticket} statuses={statuses} />
      <RequestPartsModal
        isOpen={isRequestPartsModalOpen}
        onOpenChange={setIsRequestPartsModalOpen}
        ticket={ticket}
        purchasingContacts={purchasingContacts}
      />
      <CloseTicketModal isOpen={isCloseTicketModalOpen} onOpenChange={setIsCloseTicketModalOpen} ticket={ticket} />
    </>
  );
}
