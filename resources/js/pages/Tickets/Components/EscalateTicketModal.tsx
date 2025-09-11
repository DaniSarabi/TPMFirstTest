import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Ticket } from '@/types/ticket';
import { useForm } from '@inertiajs/react';
import { AlertTriangle, Send } from 'lucide-react';
import * as React from 'react';

// Define the props for the modal
interface EscalateTicketModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    ticket: Ticket;
}

export function EscalateTicketModal({ isOpen, onOpenChange, ticket }: EscalateTicketModalProps) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        comment: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('tickets.escalate', ticket.id), {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Escalate Ticket to High Priority?</DialogTitle>
                    <DialogDescription>
                        This action will mark the ticket as High Priority and apply the necessary machine tags, which may take the machine out of service.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-50 p-4 text-sm text-amber-900">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p>
                        Please confirm that this issue is critical and requires immediate attention. This action cannot be easily undone.
                    </p>
                </div>

                <form id="escalate-ticket-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="comment">Reason for Escalation (Optional)</Label>
                        <Textarea
                            id="comment"
                            value={data.comment}
                            onChange={(e) => setData('comment', e.target.value)}
                            placeholder="e.g., 'The issue is worse than initially reported, potential safety hazard...'"
                        />
                        <InputError message={errors.comment} />
                    </div>
                </form>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="escalate-ticket-form" variant="destructive" disabled={processing}>
                        <Send className="mr-2 h-4 w-4" />
                        {processing ? 'Escalating...' : 'Confirm Escalation'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
