import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScheduledMaintenanceEvent } from '@/types/maintenance';
import { CircleArrowRight, CircleX, Send } from 'lucide-react';
import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (deleteScope: 'single' | 'future') => void;
  event: ScheduledMaintenanceEvent | null;
}

export function DeleteEventDialog({ isOpen, onOpenChange, onConfirm, event }: Props) {
  const [deleteScope, setDeleteScope] = useState<'single' | 'future'>('single');
  const isSeries = !!event?.extendedProps.series_id;

  const handleConfirm = () => {
    onConfirm(deleteScope);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone. This will permanently delete the maintenance event.</AlertDialogDescription>
        </AlertDialogHeader>
        {isSeries && (
          <div className="gap-6 space-y-2 rounded-md border p-4 ring ring-ring">
            <Label className="font-bold">Deletion Options</Label>
            <RadioGroup value={deleteScope} onValueChange={(value) => setDeleteScope(value as 'single' | 'future')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="delete-single" />
                <Label htmlFor="delete-single">Delete this event only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="future" id="delete-future" />
                <Label htmlFor="delete-future">Delete this and all future events in the series</Label>
              </div>
            </RadioGroup>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>
            <CircleX className="mr-2 h-4 w-4" />
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            <CircleArrowRight className="mr-2 h-4 w-4" />
            Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
