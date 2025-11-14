import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Machine } from '@/types/machine';
import { Check } from 'lucide-react';
import * as React from 'react';
import { Channel } from '../notifications';

interface ExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: { eventKey: string; channel: Channel } | null;
  allMachines: Machine[];
  allNotificationTypes: Record<string, Record<string, string>>;
  isGlobalOn: (eventKey: string, channel: Channel) => boolean;
  getMachineExceptions: (eventKey: string, channel: Channel) => Set<number>;
  onSave: (eventKey: string, channel: Channel, selectedMachineIds: Set<number>) => void;
}

export function ExceptionModal({
  isOpen,
  onClose,
  context,
  allMachines,
  allNotificationTypes,
  isGlobalOn,
  getMachineExceptions,
  onSave,
}: ExceptionModalProps) {
  const [selectedIds, setSelectedIds] = React.useState(new Set<number>());

  // Cuando el modal se abre, calcula qué máquinas deben estar marcadas
  React.useEffect(() => {
    if (!context || !isOpen) return;
    const { eventKey, channel } = context;

    const globalOn = isGlobalOn(eventKey, channel);

    if (globalOn) {
      // Lógica "Opt-Out": Global está ON, así que marcamos TODAS
      setSelectedIds(new Set(allMachines.map((m) => m.id)));
    } else {
      // Lógica "Opt-In": Global está OFF, así que solo marcamos las excepciones guardadas
      setSelectedIds(getMachineExceptions(eventKey, channel));
    }
  }, [isOpen, context, allMachines, isGlobalOn, getMachineExceptions]);

  const handleToggleMachine = (machineId: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(machineId);
      } else {
        next.delete(machineId);
      }
      return next;
    });
  };

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(allMachines.map((m) => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSave = () => {
    if (!context) return;
    onSave(context.eventKey, context.channel, selectedIds);
  };

  const description = context
    ? allNotificationTypes[context.eventKey.split('.')[0]]?.[`${context.eventKey}.${context.channel}`] || 'this notification'
    : 'this notification';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Exceptions</DialogTitle>
          <DialogDescription>
            You are editing exceptions for: <strong className="text-primary">{description}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
          <div className="sticky top-0 flex items-center space-x-2 rounded-md bg-muted p-2">
            <Checkbox id="toggle-all" checked={selectedIds.size === allMachines.length} onCheckedChange={handleToggleAll} />
            <Label htmlFor="toggle-all" className="flex-1 cursor-pointer font-semibold">
              Toggle All Machines
            </Label>
          </div>

          {allMachines.map((machine) => (
            <div key={machine.id} className="flex items-center space-x-2 rounded-md p-2 hover:bg-muted">
              <Checkbox
                id={`machine-${machine.id}`}
                checked={selectedIds.has(machine.id)}
                onCheckedChange={(checked) => handleToggleMachine(machine.id, !!checked)}
              />
              <Label htmlFor={`machine-${machine.id}`} className="flex-1 cursor-pointer">
                {machine.name}
              </Label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Check className="mr-2 h-4 w-4" />
            Save Exceptions ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
