import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';
import * as React from 'react';
import { BehaviorsInfoModal } from '../BehaviorsInfoModal';
import { Behavior, TicketStatus } from './Columns';
import { MachineStatus } from '../MachineStatus/Columns';

// Define the shape of a behavior object for the form
interface BehaviorData {
  id: number;
}

// Define the props for the modal
interface TicketStatusFormModalProps {
  status: Partial<TicketStatus> | null;
  machineStatuses: MachineStatus[];
  behaviors: Behavior[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  data: any;
  setData: (key: string, value: any) => void;
  processing: boolean;
  errors: any;
}

export function TicketStatusFormModal({
  status,
  machineStatuses,
  behaviors,
  isOpen,
  onOpenChange,
  onSubmit,
  data,
  setData,
  processing,
  errors,
}: TicketStatusFormModalProps) {
  const [isInfoModalOpen, setIsInfoModalOpen] = React.useState(false);
  const isEditing = !!status?.id;

  const setsMachineStatusBehavior = behaviors.find((b) => b.name === 'sets_machine_status');
  const setsMachineStatusIsSelected = data.behaviors?.some((b: BehaviorData) => b.id === setsMachineStatusBehavior?.id);

  const handleBehaviorChange = (behaviorId: number, checked: boolean) => {
    let currentBehaviors = data.behaviors || [];
    if (checked) {
      currentBehaviors = [...currentBehaviors, { id: behaviorId, machine_status_id: null }];
    } else {
      currentBehaviors = currentBehaviors.filter((b: BehaviorData) => b.id !== behaviorId);
    }
    setData('behaviors', currentBehaviors);
  };

  const handleMachineStatusChangeForBehavior = (machineStatusId: number) => {
    if (!setsMachineStatusBehavior) return;
    const updatedBehaviors = data.behaviors.map((b: BehaviorData) =>
      b.id === setsMachineStatusBehavior.id ? { ...b, machine_status_id: machineStatusId } : b,
    );
    setData('behaviors', updatedBehaviors);
  };

  // ---  Find the currently selected machine status for the dropdown value ---
  const selectedMachineStatusId = setsMachineStatusBehavior
    ? data.behaviors?.find((b: BehaviorData) => b.id === setsMachineStatusBehavior.id)?.machine_status_id
    : null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Ticket Status' : 'Create Ticket Status'}</DialogTitle>
            <DialogDescription>Configure the rules and appearance for this ticket status.</DialogDescription>
          </DialogHeader>
          <form id="ticket-status-form" onSubmit={onSubmit} className="grid gap-4 py-4">
            {/* //*********** Name ***********\\ */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required className='ring-1 ring-ring hover:bg-accent hover:text-accent-foreground'/>
              <InputError message={errors.name} />
            </div>

            {/* //*********** Behaviors ***********\\ */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Behaviors</Label>
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsInfoModalOpen(true)}>
                  <Info className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 rounded-md border p-4 shadow ring-1 ring-ring drop-shadow-lg">
                {behaviors.map((behavior) => (
                  <div key={behavior.id} className="flex items-center space-x-2">
                    <Checkbox
                      className="bg-accent ring-1 ring-ring"
                      id={`behavior-${behavior.id}`}
                      checked={data.behaviors?.some((b: BehaviorData) => b.id === behavior.id)}
                      onCheckedChange={(checked) => handleBehaviorChange(behavior.id, !!checked)}
                    />
                    <Label htmlFor={`behavior-${behavior.id}`} className="px-2 py-0.5 hover:rounded hover:bg-accent hover:text-accent-foreground">
                      {behavior.title}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* ---  Conditionally render the machine status dropdown --- */}
            {setsMachineStatusIsSelected && (
              <div className="space-y-2">
                <Label htmlFor="machine_status_id_for_behavior">Machine Status to Set</Label>
                <Select
                  // --- Use the pre-loaded value ---
                  value={selectedMachineStatusId ? String(selectedMachineStatusId) : ''}
                  onValueChange={(value) => handleMachineStatusChangeForBehavior(Number(value))}
                >
                  <SelectTrigger className="hover:bg-accent hover:text-accent-foreground ring ring-ring">
                    <SelectValue placeholder="Select a machine status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {/* ---  Add styled items to the dropdown --- */}
                    {machineStatuses.map((ms) => (
                      <SelectItem key={ms.id} value={String(ms.id)} className="hover:bg-accent hover:text-accent-foreground">
                        <div className="flex items-center">
                          <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: ms.bg_color }} />
                          <span>{ms.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* //*********** Color Picker ***********\\ */}
            <div className="space-y-2">
              <Label>Color & Preview</Label>
              <div className="flex items-center gap-4">
                <ColorPicker
                  value={{ bgColor: data.bg_color, textColor: data.text_color }}
                  onChange={(colors) => {
                    setData('bg_color', colors.bgColor);
                    setData('text_color', colors.textColor);
                  }}
                />
                <div className="flex flex-1 items-center justify-center rounded-md p-4">
                  <Badge
                    className="px-4 py-2 text-base"
                    style={{
                      backgroundColor: data.bg_color,
                      color: data.text_color,
                    }}
                  >
                    {data.name || 'Preview'}
                  </Badge>
                </div>
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="ticket-status-form" disabled={processing}>
              {processing ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BehaviorsInfoModal isOpen={isInfoModalOpen} onOpenChange={setIsInfoModalOpen} behaviors={behaviors} />
    </>
  );
}
