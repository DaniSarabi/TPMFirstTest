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
import { MachineStatus } from './Columns';

// Define the props for our new modal
interface ReassignAndDeleteStatusModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (newStatusId: number) => void; // The confirm function now takes the new status ID
  statusToDelete: Partial<MachineStatus> | null;
  otherStatuses: MachineStatus[]; // The list of statuses to choose from
}

export function ReassignAndDeleteStatusModal({ isOpen, onOpenChange, onConfirm, statusToDelete, otherStatuses }: ReassignAndDeleteStatusModalProps) {
  // State to hold the ID of the status the user selects from the dropdown
  const [newStatusId, setNewStatusId] = React.useState<number | null>(null);

  // Reset the selection when the modal opens
  React.useEffect(() => {
    if (isOpen) {
      setNewStatusId(otherStatuses[0]?.id || null);
    }
  }, [isOpen]);

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
            This status is currently in use. To delete it, please choose a new status to assign to all affected machines. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="new-status-select">Re-assign machines to:</Label>
          <Select value={newStatusId ? String(newStatusId) : ''} onValueChange={(value) => setNewStatusId(Number(value))}>
            <SelectTrigger id="new-status-select" className="bg-accent ring-1 ring-ring hover:bg-accent hover:text-accent-foreground">
              <SelectValue placeholder="Select a new status..." />
            </SelectTrigger>
            <SelectContent>
              {otherStatuses.map((status) => (
                //  Customize the SelectItem to show a color preview ---
                <SelectItem key={status.id} value={String(status.id)} className="hover:bg-accent hover:text-accent-foreground">
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
