import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/lib/useCan';
import { EmailContact } from '@/types';
import { Ticket, TicketStatus } from '@/types/ticket';
import { router } from '@inertiajs/react';
import { AlertTriangle, ArrowDownCircle, ArrowRightLeft, BookmarkCheck, MoreVertical, Play, SendHorizonal, Trash2 } from 'lucide-react';
import * as React from 'react';
import { CloseTicketModal } from './CloseTicketModal';
import { ManagementAction, TicketManagementModal } from './TicketManagmentModal';

interface ActionsCardProps {
  ticket: Ticket;
  statuses: TicketStatus[];
  purchasingContacts: EmailContact[];
  onEmailToggle: (visible: boolean) => void;
  onStatusSelect: (statusId: number | null) => void;
}

export function ActionsCard({ ticket, statuses, purchasingContacts, onEmailToggle, onStatusSelect }: ActionsCardProps) {
  const [isCloseTicketModalOpen, setIsCloseTicketModalOpen] = React.useState(false);
  const [managementAction, setManagementAction] = React.useState<ManagementAction | null>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // State for change status popover
  const [isChangeStatusOpen, setIsChangeStatusOpen] = React.useState(false);
  const [selectedStatusId, setSelectedStatusId] = React.useState<string>('');
  const [sendEmail, setSendEmail] = React.useState(false);
  const [comment, setComment] = React.useState('');

  const can = {
    escalate: useCan('tickets.escalate'),
    discard: useCan('tickets.discard'),
  };

  const statusBehaviors = ticket.status.behaviors || [];
  const isOpeningStatus = statusBehaviors.some((b) => b.name === 'is_opening_status');
  const isInProgressStatus = statusBehaviors.some((b) => b.name === 'is_in_progress_status');
  const isDiagnosticStatus =
    statusBehaviors.some((b) => b.name === 'is_in_progress_status') && ticket.machine?.tags?.some((t: any) => t.slug === 'diagnostic');
  const standByBehaviors = ['is_stand_by_status', 'awaits_non_critical_parts', 'awaits_critical_parts'];
  const isStandByStatus = statusBehaviors.some((b) => standByBehaviors.includes(b.name));
  const isClosingOrDiscarded = statusBehaviors.some((b) => b.name === 'is_ticket_closing_status' || b.name === 'is_ticket_discard_status');

  const handleStartWork = () => {
    router.patch(route('tickets.start-work', ticket.id), {}, { preserveScroll: true });
  };

  const handleResumeWork = () => {
    router.patch(route('tickets.resume-work', ticket.id), {}, { preserveScroll: true });
  };

  const handleManageSelect = (action: ManagementAction) => {
    setManagementAction(action);
    setIsMenuOpen(false);
  };

  const handleChangeStatus = () => {
    if (!selectedStatusId) return;

    // Notify parent about email builder visibility
    onEmailToggle(sendEmail);
    onStatusSelect(sendEmail ? parseInt(selectedStatusId) : null);

    if (!sendEmail) {
      // If no email, submit immediately
      router.patch(
        route('tickets.change-status', ticket.id),
        {
          status_id: parseInt(selectedStatusId),
          comment: comment || null,
        },
        {
          preserveScroll: true,
          onSuccess: () => {
            setIsChangeStatusOpen(false);
            setSelectedStatusId('');
            setComment('');
            setSendEmail(false);
          },
        },
      );
    } else {
      // If email is checked, close popover and let user fill email builder
      setIsChangeStatusOpen(false);
    }
  };

  if (isClosingOrDiscarded) {
    return null;
  }

  const canManage = (can.escalate && ticket.priority === 1) || can.discard;

  // Show "Start Work" button for opening or diagnostic status
  const showStartWorkButton = isOpeningStatus || isDiagnosticStatus;

  // Show "Resume Work" for any standby state
  const showResumeWorkButton = isStandByStatus;

  // Show "Change Status" popover for in-progress or standby states
  const showChangeStatusButton = isInProgressStatus || isStandByStatus;

  return (
    <>
      <div className="flex flex-row items-center gap-2">
        {/* Start Work Button */}
        {showStartWorkButton && (
          <Button className="w-full flex-1 bg-green-600 transition-all duration-300 hover:-translate-y-1" onClick={handleStartWork}>
            <Play className="mr-2 h-4 w-4" />
            Start Work
          </Button>
        )}

        {/* Resume Work Button */}
        {showResumeWorkButton && (
          <Button className="w-full flex-1 bg-green-600 transition-all duration-300 hover:-translate-y-1" onClick={handleResumeWork}>
            <Play className="mr-2 h-4 w-4" />
            Resume Work
          </Button>
        )}

        {/* Change Status Popover */}
        {showChangeStatusButton && (
          <Popover open={isChangeStatusOpen} onOpenChange={setIsChangeStatusOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="font- w-full flex-1 bg-primary text-primary-foreground">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Change Status
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 border-0 shadow-none drop-shadow-lg" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">New Status</Label>
                  <Select value={selectedStatusId} onValueChange={setSelectedStatusId}>
                    <SelectTrigger className="border-0 bg-muted hover:cursor-pointer" id="status">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses
                        .filter((status) => {
                          // 1. Filtra el estado actual del ticket
                          if (status.id === ticket.status.id) {
                            return false;
                          }

                          // 2. Filtra por comportamientos
                          const behaviors = status.behaviors || [];
                          const shouldFilterByBehavior = behaviors.some((b: any) =>
                            ['is_opening_status', '', 'is_ticket_closing_status', 'is_ticket_discard_status', 'awaits_non_critical_parts','awaits_critical_parts'].includes(b.name),
                          );

                          return !shouldFilterByBehavior;
                        })
                        .map((status) => (
                          <SelectItem key={status.id} value={status.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: status.bg_color }} />
                              <span>{status.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">Comment (optional)</Label>
                  <Textarea
                    id="comment"
                    className="min-h-[80px] w-full rounded-md border border-input bg-muted px-3 py-2 text-sm"
                    placeholder="Add a comment about this status change..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                {/* <div className="flex items-center space-x-2">
                  <Checkbox id="send-email" checked={sendEmail} onCheckedChange={(checked) => setSendEmail(checked as boolean)} />
                  <Label htmlFor="send-email" className="cursor-pointer text-sm font-normal">
                    Send email notification
                  </Label>
                </div> */}

                <Button onClick={handleChangeStatus} disabled={!selectedStatusId} className="w-full">
                  <SendHorizonal className="mr-2 h-4 w-4" />
                  {sendEmail ? 'Continue to Email' : 'Update Status'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Close Ticket Button (only in In Progress) */}
        {isInProgressStatus && (
          <Button className="w-full flex-1" variant="destructive" onClick={() => setIsCloseTicketModalOpen(true)}>
            <BookmarkCheck className="mr-2 h-4 w-4" />
            Close Ticket
          </Button>
        )}

        {/* Management Dropdown */}
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
      <CloseTicketModal isOpen={isCloseTicketModalOpen} onOpenChange={setIsCloseTicketModalOpen} ticket={ticket} />
      <TicketManagementModal
        isOpen={!!managementAction}
        onOpenChange={(isOpen) => !isOpen && setManagementAction(null)}
        ticket={ticket}
        action={managementAction}
      />
    </>
  );
}
