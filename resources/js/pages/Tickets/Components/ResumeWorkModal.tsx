import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { Info } from 'lucide-react';
import * as React from 'react';
import { Ticket } from '../Columns';

interface ResumeWorkModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ResumeWorkModal({ ticket, isOpen, onOpenChange }: ResumeWorkModalProps) {
  const { data, setData, patch, processing, errors, reset } = useForm({
    comment: '',
  });

  React.useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    patch(route('tickets.resume-work', ticket.id));
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resume Work on Ticket #{ticket.id}</DialogTitle>
          <DialogDescription>
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-blue-500/50 bg-blue-50 p-3 text-sm text-blue-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                This will set the ticket's status back to "In Progress". You can add a comment to explain the update (e.g., "Parts have arrived").
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <form id="resume-work-form" onSubmit={submit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea id="comment" value={data.comment} onChange={(e) => setData('comment', e.target.value)} placeholder="Add a comment..." />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="resume-work-form" disabled={processing}>
            {processing ? 'Saving...' : 'Resume Work'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
