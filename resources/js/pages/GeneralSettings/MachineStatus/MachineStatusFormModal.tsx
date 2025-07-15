import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import * as React from 'react';
import { MachineStatus } from './Columns';

// --- ACTION 1: Update the props to receive form state and handlers ---
interface StatusFormModalProps {
  status: Partial<MachineStatus> | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  data: { name: string; description: string; bg_color: string; text_color: string };
  setData: (key: string, value: any) => void;
  processing: boolean;
  errors: Partial<Record<keyof MachineStatus, string>>;
}

export function StatusFormModal({ status, isOpen, onOpenChange, onSubmit, data, setData, processing, errors }: StatusFormModalProps) {
  const isEditing = !!status?.id;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Status' : 'Create Status'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for the "${status?.name}" status.` : 'Create a new status for your system.'}
          </DialogDescription>
        </DialogHeader>
        {/*  The form now uses the onSubmit prop from the parent --- */}
        <form id="status-form" onSubmit={onSubmit} className="grid gap-4 py-4" autoComplete='off'>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input className='ring-1 ring-ring hover:bg-accent' id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
            <InputError message={errors.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea className='ring-1 ring-ring hover:bg-accent' id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} />
            <InputError message={errors.description} />
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
              <div className="flex flex-1 items-center justify-center rounded-md  p-4">
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
