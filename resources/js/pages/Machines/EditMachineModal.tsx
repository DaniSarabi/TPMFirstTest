import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import * as React from 'react';
import { Machine } from './Columns';

// Define the props for the modal
interface EditMachineModalProps {
  machine: Machine;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// Define the specific status type for clarity
type MachineStatus = 'New' | 'In Service' | 'Under Maintenance' | 'Out of Service';

export function EditMachineModal({ machine, isOpen, onOpenChange }: EditMachineModalProps) {
  const { data, setData, post, errors, processing, reset } = useForm({
    name: machine.name,
    description: machine.description || '',
    status: machine.status,
    image: null as File | null,
    _method: 'PUT',
  });

  // This useEffect hook resets the form when the modal opens.
  React.useEffect(() => {
    if (isOpen) {
      // --- ACTION: Call reset() FIRST ---
      // This clears any validation errors from previous attempts.
      reset();

      // --- ACTION: Call setData() SECOND ---
      // This now correctly populates the form with the latest machine data.
      setData({
        name: machine.name,
        description: machine.description || '',
        status: machine.status,
        image: null,
        _method: 'PUT',
      });
    }
  }, [isOpen, machine]); // This effect runs only when the modal is opened or the machine data changes.

  // Handle the form submission
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('machines.update', machine.id), {
      forceFormData: true,
      // This ensures the modal only closes after a successful submission.
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Machine: {machine.name}</DialogTitle>
          <DialogDescription>Make changes to your machine here. Click save when you're done.</DialogDescription>
        </DialogHeader>
        {/* Add name and autocomplete attributes for accessibility */}
        <form id="edit-machine-form" onSubmit={submit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Machine Name</Label>
            <Input id="edit-name" name="name" autoComplete="off" value={data.name} onChange={(e) => setData('name', e.target.value)} required  className='hover:bg-accent hover:text-accent-foreground'/>
            <InputError message={errors.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              name="description"
              autoComplete="off"
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              className='hover:bg-accent hover:text-accent-foreground'
            />
            <InputError message={errors.description} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={data.status} onValueChange={(value) => setData('status', value as MachineStatus)}>
              <SelectTrigger id="edit-status" name="status" className='hover:bg-accent hover:text-accent-foreground'>
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent >
                <SelectItem value="New" className='hover:bg-primary hover:text-primary-foreground'>New</SelectItem>
                <SelectItem value="In Service" className='hover:bg-primary hover:text-primary-foreground'>In Service</SelectItem>
                <SelectItem value="Under Maintenance" className='hover:bg-primary hover:text-primary-foreground'>Under Maintenance</SelectItem>
                <SelectItem value="Out of Service" className='hover:bg-primary hover:text-primary-foreground'>Out of Service</SelectItem>
              </SelectContent>
            </Select>
            <InputError message={errors.status} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-image">Change Machine Image (Optional)</Label>
            <Input className='hover:bg-accent hover:text-accent-foreground' id="edit-image" name="image" type="file" onChange={(e) => setData('image', e.target.files ? e.target.files[0] : null)} />
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
