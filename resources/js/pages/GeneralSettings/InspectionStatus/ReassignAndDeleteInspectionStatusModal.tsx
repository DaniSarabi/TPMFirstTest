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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as React from 'react';
import { InspectionStatus } from './Columns';

// Define the props for our new modal
interface ReassignAndDeleteStatusModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (newStatusId: number) => void;
  statusToDelete: InspectionStatus | null;
  otherStatuses: InspectionStatus[];
}

export function ReassignAndDeleteStatusModal({ isOpen, onOpenChange, onConfirm, statusToDelete, otherStatuses }: ReassignAndDeleteStatusModalProps) {
  const [newStatusId, setNewStatusId] = React.useState<number | null>(null);

  // Reset the selection when the modal opens
  React.useEffect(() => {
    if (isOpen && otherStatuses.length > 0) {
      setNewStatusId(otherStatuses[0].id);
    } else {
      setNewStatusId(null);
    }
  }, [isOpen, otherStatuses]);

  const handleConfirm = () => {
    if (newStatusId) {
      onConfirm(newStatusId);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Status: "{statusToDelete?.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This status may be in use. To delete it, please choose a new status to assign to all affected items. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="new-status-select">Re-assign items to:</Label>
          <Select value={newStatusId ? String(newStatusId) : ''} onValueChange={(value) => setNewStatusId(Number(value))}>
            <SelectTrigger id="new-status-select">
              <SelectValue placeholder="Select a new status..." />
            </SelectTrigger>
            <SelectContent>
              {otherStatuses.map((status) => (
                <SelectItem key={status.id} value={String(status.id)}>
                  <div className="flex items-center">
                    <div className="mr-2 h-3 w-3 rounded-full border" style={{ backgroundColor: status.bg_color }} />
                    <span>{status.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!newStatusId}>
            Re-assign and Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
