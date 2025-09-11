import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Ticket } from '@/types/ticket';
import { useForm } from '@inertiajs/react';
import { AlertTriangle, ArrowDownCircle, Check, CircleX, Trash2 } from 'lucide-react';
import * as React from 'react';

// Define the possible actions this modal can perform
export type ManagementAction = 'escalate' | 'downgrade' | 'discard';

interface ModalContent {
    title: string;
    description: string;
    icon: React.ElementType;
    confirmText: string;
    confirmVariant: 'default' | 'destructive';
    commentLabel: string;
}

// A map to hold the specific content for each action type
const ACTION_DETAILS: Record<ManagementAction, ModalContent> = {
    escalate: {
        title: 'Escalate Ticket Priority',
        description:
            'This will change the ticket priority to High (Sev 2) and apply the "Out of Service" tag to the machine, which may create a new downtime log. Are you sure?',
        icon: AlertTriangle,
        confirmText: 'Confirm Escalation',
        confirmVariant: 'default',
        commentLabel: 'Reason for escalation (Optional)',
    },
    downgrade: {
        title: 'Downgrade Ticket Priority',
        description:
            'This will change the ticket priority to Medium (Sev 1) and remove the "Out of Service" tag from the machine, which will end any related downtime. Are you sure?',
        icon: ArrowDownCircle,
        confirmText: 'Confirm Downgrade',
        confirmVariant: 'default',
        commentLabel: 'Reason for downgrade (Required)',
    },
    discard: {
        title: 'Discard Ticket',
        description:
            'This will permanently mark the ticket as discarded and remove all associated tags from the machine, ending any downtime. This action cannot be undone.',
        icon: Trash2,
        confirmText: 'Yes, Discard Ticket',
        confirmVariant: 'destructive',
        commentLabel: 'Reason for discarding (Required)',
    },
};

interface Props {
    ticket: Ticket;
    action: ManagementAction | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function TicketManagementModal({ ticket, action, isOpen, onOpenChange }: Props) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        comment: '',
    });

    const details = action ? ACTION_DETAILS[action] : null;

    React.useEffect(() => {
        // Reset the form when the modal opens
        if (isOpen) {
            reset();
        }
    }, [isOpen]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!action) return;

        let routeName: string;
        if (action === 'escalate') routeName = 'tickets.escalate';
        else if (action === 'downgrade') routeName = 'tickets.downgrade';
        else routeName = 'tickets.discard';

        patch(route(routeName, ticket.id), {
            onSuccess: () => onOpenChange(false),
        });
    };

    if (!details) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <details.icon className="h-6 w-6" />
                        {details.title}
                    </DialogTitle>
                    <DialogDescription>{details.description}</DialogDescription>
                </DialogHeader>
                <form id="ticket-management-form" onSubmit={submit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="comment">{details.commentLabel}</Label>
                        <Textarea
                            id="comment"
                            value={data.comment}
                            onChange={(e) => setData('comment', e.target.value)}
                            placeholder="Provide a clear reason for this action..."
                            className="min-h-[100px] ring ring-ring"
                        />
                        <InputError message={errors.comment} />
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        <CircleX className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                    <Button type="submit" form="ticket-management-form" variant={details.confirmVariant} disabled={processing}>
                        <Check className="mr-2 h-4 w-4" />
                        {processing ? 'Processing...' : details.confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
