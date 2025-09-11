import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCan } from '@/lib/useCan';
import { EmailContact } from '@/types';
import { Ticket, TicketStatus } from '@/types/ticket';
import { router } from '@inertiajs/react';
import { AlertTriangle, ArrowDownCircle, BookmarkCheck, Mail, MoreVertical, Play, Trash2 } from 'lucide-react';
import * as React from 'react';
import { ChangeStatusModal } from './ChangeStatusModal';
import { CloseTicketModal } from './CloseTicketModal';
import { RequestPartsModal } from './RequestPartsModal';
import { ResumeWorkModal } from './ResumeWorkModal';
import { ManagementAction, TicketManagementModal } from './TicketManagmentModal';

interface ActionsCardProps {
  ticket: Ticket;
  statuses: TicketStatus[];
  purchasingContacts: EmailContact[];
}

export function ActionsCard({ ticket, statuses, purchasingContacts }: ActionsCardProps) {
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = React.useState(false);
  const [isRequestPartsModalOpen, setIsRequestPartsModalOpen] = React.useState(false);
  const [isCloseTicketModalOpen, setIsCloseTicketModalOpen] = React.useState(false);
  const [isResumeWorkModalOpen, setIsResumeWorkModalOpen] = React.useState(false);
  const [managementAction, setManagementAction] = React.useState<ManagementAction | null>(null);

  // --- ACTION: Add state to control the dropdown menu's visibility ---
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const can = {
    escalate: useCan('tickets.escalate'),
    discard: useCan('tickets.discard'),
  };

  const statusBehaviors = ticket.status.behaviors || [];
  const isOpeningStatus = statusBehaviors.some((b) => b.name === 'is_opening_status');
  const isInProgressStatus = statusBehaviors.some((b) => b.name === 'is_in_progress_status');
  const isAwaitingPartsStatus =
    statusBehaviors.some((b) => b.name === 'awaits_critical_parts') || statusBehaviors.some((b) => b.name === 'awaits_non_critical_parts');
  const isClosingOrDiscarded = statusBehaviors.some((b) => b.name === 'is_ticket_closing_status' || b.name === 'is_ticket_discard_status');
  const handleStartWork = () => {
    router.patch(route('tickets.start-work', ticket.id), { preserveScroll: true });
  };

  if (isClosingOrDiscarded) {
    return null;
  }

  const canManage = (can.escalate && ticket.priority === 1) || can.discard;

  const handleManageSelect = (action: ManagementAction) => {
    setManagementAction(action);
    setIsMenuOpen(false);
  };

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
            <Button className="w-full flex-1" onClick={() => setIsRequestPartsModalOpen(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Request Parts
            </Button>
            <Button className="w-full flex-1" variant="destructive" onClick={() => setIsCloseTicketModalOpen(true)}>
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

        {canManage && (
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="ml-auto">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Manage Ticket</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {can.escalate && ticket.priority === 1 && (
                <DropdownMenuItem onSelect={() => handleManageSelect('escalate')}>
                  <AlertTriangle className="mr-2 h-4 w-4 text-amber-600" />
                  <span className="text-amber-600">Escalate Priority</span>
                </DropdownMenuItem>
              )}
              {can.discard && ticket.priority === 2 && (
                <DropdownMenuItem onSelect={() => handleManageSelect('downgrade')}>
                  <ArrowDownCircle className="mr-2 h-4 w-4 text-blue-600" />
                  <span className="text-blue-600">Downgrade Priority</span>
                </DropdownMenuItem>
              )}
              {can.discard && (
                <DropdownMenuItem onSelect={() => handleManageSelect('discard')} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                  <span>Discard Ticket</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Modals */}
      <ChangeStatusModal isOpen={isChangeStatusModalOpen} onOpenChange={setIsChangeStatusModalOpen} ticket={ticket} statuses={statuses} />
      <RequestPartsModal
        isOpen={isRequestPartsModalOpen}
        onOpenChange={setIsRequestPartsModalOpen}
        ticket={ticket}
        purchasingContacts={purchasingContacts}
      />
      <CloseTicketModal isOpen={isCloseTicketModalOpen} onOpenChange={setIsCloseTicketModalOpen} ticket={ticket} />
      <ResumeWorkModal isOpen={isResumeWorkModalOpen} onOpenChange={setIsResumeWorkModalOpen} ticket={ticket} />
      <TicketManagementModal
        isOpen={!!managementAction}
        onOpenChange={(isOpen) => !isOpen && setManagementAction(null)}
        ticket={ticket}
        action={managementAction}
      />
    </>
  );
}
