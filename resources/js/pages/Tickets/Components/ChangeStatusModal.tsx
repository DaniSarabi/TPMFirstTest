import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Ticket, TicketStatus } from '@/types/ticket';
import { useForm } from '@inertiajs/react';
import { AlertTriangle, CircleX, Send } from 'lucide-react';
import * as React from 'react';

// Define the props for the modal
interface ChangeStatusModalProps {
  ticket: Ticket;
  statuses: TicketStatus[]; // The list of available statuses
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ChangeStatusModal({ ticket, statuses, isOpen, onOpenChange }: ChangeStatusModalProps) {
  const { data, setData, patch, processing, errors, reset } = useForm({
    new_status_id: ticket.status.id,
    comment: '',
  });

  // Reset the form when the modal opens
  React.useEffect(() => {
    if (isOpen) {
      reset();
      setData('new_status_id', ticket.status.id);
    }
  }, [isOpen]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    patch(route('tickets.status.update', ticket.id), {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Ticket Status</DialogTitle>
          <DialogDescription>Select a new status for this ticket. You can also add a comment to log the reason for the change.</DialogDescription>
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-yellow-500/50 bg-yellow-50 p-3 text-sm text-yellow-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Please be aware that changing the status may trigger automated behaviors, such as starting a downtime log.</p>
          </div>
        </DialogHeader>
        <form id="change-status-form" onSubmit={submit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new_status_id">New Status</Label>
            <Select value={String(data.new_status_id)} onValueChange={(value) => setData('new_status_id', Number(value))}>
              <SelectTrigger id="new_status_id" className="ring-1 hover:bg-accent hover:ring-primary">
                <SelectValue placeholder="Select a status..." />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={String(status.id)} className="hover:bg-accent">
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full border" style={{ backgroundColor: status.bg_color }} />
                      <span>{status.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={errors.new_status_id} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              className="ring-1 hover:bg-accent hover:ring-primary"
              id="comment"
              value={data.comment}
              onChange={(e) => setData('comment', e.target.value)}
              placeholder="Add a comment explaining the status change..."
            />
            <InputError message={errors.comment} />
          </div>
        </form>
        <DialogFooter>
          <Button className='hover:bg-destructive hover:text-destructive-foreground' variant="outline" onClick={() => onOpenChange(false)}>
            <CircleX />
            Cancel
          </Button>
          <Button type="submit" form="change-status-form" disabled={processing}>
            <Send />
            {processing ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
