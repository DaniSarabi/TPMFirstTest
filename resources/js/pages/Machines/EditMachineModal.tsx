import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Machine, MachineStatus } from '@/types/machine';
import { useForm } from '@inertiajs/react';
import { Info } from 'lucide-react';
import * as React from 'react';

// Define the props for the modal
interface EditMachineModalProps {
  machine: Machine;
  statuses: MachineStatus[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function EditMachineModal({ machine, statuses, isOpen, onOpenChange }: EditMachineModalProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    _method: 'PUT',
    name: machine.name,
    description: machine.description || '',
    machine_status_id: machine.machine_status.id,
    image: null as File | null,
  });

  // Reset the form when the modal opens or the machine prop changes
  React.useEffect(() => {
    if (isOpen) {
      reset();
      setData({
        name: machine.name,
        description: machine.description || '',
        machine_status_id: machine.machine_status.id,
        image: null,
        _method: 'PUT',
      });
    }
  }, [isOpen, machine]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('machines.update', machine.id), {
      onSuccess: () => onOpenChange(false),
    });
  };

  // --- ACTION: Update the filter logic to use the boolean flag ---
  const availableStatuses = React.useMemo(() => {
    // Find the status that is marked as the operational default
    const operationalDefaultStatus = statuses.find((s) => s.is_operational_default);
    const currentStatus = statuses.find((s) => s.id === machine.machine_status.id);

    // Use a Map to prevent duplicate statuses in the dropdown
    const options = new Map<number, MachineStatus>();
    if (currentStatus) {
      options.set(currentStatus.id, currentStatus);
    }
    if (operationalDefaultStatus) {
      options.set(operationalDefaultStatus.id, operationalDefaultStatus);
    }

    return Array.from(options.values());
  }, [statuses, machine.machine_status.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Machine: {machine.name}</DialogTitle>
            Update the details for this machine.
            <br />
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-blue-500/50 bg-blue-50 p-3 text-sm text-blue-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Note: The status can only be manually changed to the operational status.</span>
            </div>
        </DialogHeader>
        <form id="edit-machine-form" onSubmit={submit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              className="ring-1 ring-ring hover:bg-accent"
              id="name"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              required
            />
            <InputError message={errors.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              className="ring-1 ring-ring hover:bg-accent"
              id="description"
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
            />
            <InputError message={errors.description} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="machine_status_id">Status</Label>
            <Select value={String(data.machine_status_id)} onValueChange={(value) => setData('machine_status_id', Number(value))}>
              <SelectTrigger className="ring-1 ring-ring hover:bg-accent" id="machine_status_id">
                <SelectValue placeholder="Select a status..." />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem className="hover:bg-accent" key={status.id} value={String(status.id)}>
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full border" style={{ backgroundColor: status.bg_color }} />
                      <span>{status.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={errors.machine_status_id} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Update Image (Optional)</Label>
            <Input
              className="ring-1 ring-ring hover:bg-accent"
              id="image"
              type="file"
              onChange={(e) => setData('image', e.target.files ? e.target.files[0] : null)}
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
