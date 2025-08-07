import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox'; // --- ACTION: Import Checkbox ---
import { ColorPicker } from '@/components/ui/color-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Info } from 'lucide-react';
import * as React from 'react';
import { MachineStatus } from './Columns';

// --- ACTION: Update the props to include the new field ---
interface StatusFormModalProps {
  status: Partial<MachineStatus> | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  data: { name: string; description: string; bg_color: string; text_color: string; is_operational_default: boolean };
  setData: (key: string, value: any) => void;
  processing: boolean;
  errors: Partial<Record<keyof MachineStatus, string>>;
}

export function StatusFormModal({ status, isOpen, onOpenChange, onSubmit, data, setData, processing, errors }: StatusFormModalProps) {
  const isEditing = !!status?.id;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Status' : 'Create Status'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for the "${status?.name}" status.` : 'Create a new status for your system.'}
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-blue-500/50 bg-blue-50 p-3 text-sm text-blue-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Note: The operational status determine if the machine is running and producing.</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <form id="status-form" onSubmit={onSubmit} className="grid gap-4 py-4" autoComplete="off">
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
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_operational_default"
              checked={data.is_operational_default}
              onCheckedChange={(checked) => setData('is_operational_default', !!checked)}
              className='bg-muted'
            />
            <Label htmlFor="is_operational_default">Set as default operational status?</Label>
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
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
                  Live Preview
                </Badge>
              </div>
            </div>
          </div>
          {/* --- ACTION: Add the new checkbox for the default operational status --- */}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="status-form" disabled={processing}>
            {processing ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
