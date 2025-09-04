import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Ticket } from '@/types/ticket';
import { useForm } from '@inertiajs/react';
import { CircleX, Send } from 'lucide-react';
import * as React from 'react';

// Define the props for the modal
interface CloseTicketModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CloseTicketModal({ ticket, isOpen, onOpenChange }: CloseTicketModalProps) {
  const { data, setData, patch, processing, errors, reset } = useForm({
    action_taken: '',
    parts_used: '',
  });

  // Reset the form when the modal opens
  React.useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    patch(route('tickets.close', ticket.id), {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close Ticket #{ticket.id}</DialogTitle>
          <DialogDescription>Please provide the resolution details for this ticket. The "Action Taken" field is required.</DialogDescription>
        </DialogHeader>
        <form id="close-ticket-form" onSubmit={submit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="action_taken">Action Taken (Required)</Label>
            <Textarea
              id="action_taken"
              value={data.action_taken}
              onChange={(e) => setData('action_taken', e.target.value)}
              placeholder="Describe the solution and the work performed..."
              required
              className="ring-1 hover:bg-accent hover:ring-primary"
            />
            <InputError message={errors.action_taken} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parts_used">Parts Used (Optional)</Label>
            <Textarea
              id="parts_used"
              value={data.parts_used}
              onChange={(e) => setData('parts_used', e.target.value)}
              placeholder="List any parts or materials used..."
              className="ring-1 hover:bg-accent hover:ring-primary"
            />
            <InputError message={errors.parts_used} />
          </div>
        </form>
        <DialogFooter>
          <Button className='hover:bg-destructive hover:text-destructive-foreground' variant="outline" onClick={() => onOpenChange(false)}>
            <CircleX />
            Cancel
          </Button>
          <Button type="submit" form="close-ticket-form" disabled={processing}>
            <Send />
            {processing ? 'Closing...' : 'Close Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
