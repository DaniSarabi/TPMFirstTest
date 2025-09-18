import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import * as React from 'react';

// Define the shape of the subsystem data needed for the form
interface Subsystem {
  id: number;
  name: string;
}

// Define the props for the modal
interface EditSubsystemModalProps {
  subsystem: Subsystem | null; // The subsystem to edit, or null
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function EditSubsystemModal({ subsystem, isOpen, onOpenChange }: EditSubsystemModalProps) {
  const { data, setData, post, errors, processing, reset } = useForm({
    name: '',
    _method: 'PUT',
  });

  // This useEffect hook resets the form when the modal opens with a new subsystem.
  React.useEffect(() => {
    if (isOpen && subsystem) {
      setData('name', subsystem.name);
      reset(); // Clear any previous validation errors
    }
  }, [isOpen, subsystem]);

  // Handle the form submission
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subsystem) return; // Safety check

    // --- ACTION: Update the route to use the new 'updateFromPage' route ---
    post(route('subsystems.updateFromPage', subsystem.id), {
      preserveScroll: true, // Keep the user on the details page
      onSuccess: () => onOpenChange(false), // Close the modal on success
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Subsystem</DialogTitle>
          <DialogDescription>Update the name of the subsystem. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <form id="edit-subsystem-form" onSubmit={submit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-subsystem-name">Subsystem Name</Label>
            <Input id="edit-subsystem-name" name="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
            <InputError message={errors.name} />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="edit-subsystem-form" disabled={processing}>
            {processing ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
