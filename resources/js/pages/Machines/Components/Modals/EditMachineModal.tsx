import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Machine } from '@/types/machine';
import { useForm } from '@inertiajs/react';
import * as React from 'react';

// Define the props for the modal - 'statuses' is no longer needed.
interface EditMachineModalProps {
  machine: Machine;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function EditMachineModal({ machine, isOpen, onOpenChange }: EditMachineModalProps) {
  // The form state is now simpler, only containing the fields the user can edit.
  const { data, setData, post, processing, errors, reset } = useForm({
    _method: 'PUT',
    name: '',
    description: '',
    image: null as File | null,
  });

  // The useEffect hook is updated to only populate the editable fields.
  React.useEffect(() => {
    if (isOpen) {
      reset();
      setData({
        _method: 'PUT',
        name: machine.name,
        description: machine.description || '',
        image: null,
      });
    }
  }, [isOpen, machine]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('machines.update', machine.id), {
      onSuccess: () => onOpenChange(false),
      preserveState: true,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Machine: {machine.name}</DialogTitle>
          <DialogDescription>Update the basic details for this machine.</DialogDescription>
        </DialogHeader>
        {/* The form now only contains inputs for name, description, and image. */}
        <form id="edit-machine-form" onSubmit={submit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              className="ring-1 ring-ring hover:bg-accent"
              required
            />
            <InputError message={errors.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              className="ring-1 ring-ring hover:bg-accent"
            />
            <InputError message={errors.description} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Update Image (Optional)</Label>
            <Input
              id="image"
              type="file"
              onChange={(e) => setData('image', e.target.files ? e.target.files[0] : null)}
              className="ring-1 ring-ring hover:bg-accent"
            />
            <InputError message={errors.image} />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="edit-machine-form" disabled={processing}>
            {processing ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
