import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as React from 'react';
import { MachineStatus } from '../MachineStatus/Columns';
import { InspectionStatus } from './Columns';

// Define the props for the modal
interface InspectionStatusFormModalProps {
  status: Partial<InspectionStatus> | null;
  machineStatuses: MachineStatus[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  data: any;
  setData: (key: string, value: any) => void;
  processing: boolean;
  errors: Partial<Record<keyof InspectionStatus, string>>;
}

export function InspectionStatusFormModal({
  status,
  machineStatuses,
  isOpen,
  onOpenChange,
  onSubmit,
  data,
  setData,
  processing,
  errors,
}: InspectionStatusFormModalProps) {
  const isEditing = !!status?.id;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Inspection Status' : 'Create Inspection Status'}</DialogTitle>
          <DialogDescription>Configure the rules and appearance for this status.</DialogDescription>
        </DialogHeader>
        <form id="inspection-status-form" onSubmit={onSubmit} className="grid gap-4 py-4" autoComplete="false">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              className="hover:bg-accent hover:text-accent-foreground"
              id="name"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              required
            />
            <InputError message={errors.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select value={String(data.severity)} onValueChange={(v) => setData('severity', Number(v))}>
              <SelectTrigger className="hover:bg-accent hover:text-accent-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="hover:bg-green-300 hover:text-accent-foreground" value="0">
                  0 (OK)
                </SelectItem>
                <SelectItem className="hover:bg-yellow-300 hover:text-accent-foreground" value="1">
                  1 (Warning)
                </SelectItem>
                <SelectItem className="hover:bg-red-400 hover:text-accent-foreground" value="2">
                  2 (Critical)
                </SelectItem>
              </SelectContent>
            </Select>
            <InputError message={errors.severity} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="machine_status_id">On Selection, Set Machine Status To:</Label>
            {/* --- ACTION: Update the Select component to handle null correctly --- */}
            <Select
              value={data.machine_status_id ? String(data.machine_status_id) : 'null'}
              onValueChange={(v) => setData('machine_status_id', v === 'null' ? null : Number(v))}
            >
              <SelectTrigger className="hover:bg-accent hover:text-accent-foreground">
                <SelectValue placeholder="No Change" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">No Change</SelectItem>
                {machineStatuses.map((ms) => (
                  <SelectItem className="hover:bg-accent hover:text-accent-foreground" key={ms.id} value={String(ms.id)}>
                    <div className="mr-2 h-3 w-3 rounded-full border" style={{ backgroundColor: ms.bg_color }} />
                    {ms.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={errors.machine_status_id} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="auto_creates_ticket" checked={data.auto_creates_ticket} onCheckedChange={(c) => setData('auto_creates_ticket', !!c)} />
            <Label htmlFor="auto_creates_ticket">Automatically Create a Ticket?</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="is_default" checked={data.is_default} onCheckedChange={(c) => setData('is_default', !!c)} />
            <Label htmlFor="is_default">Is this the default status for new inspections?</Label>
          </div>
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
              <div className="flex flex-1 items-center justify-center rounded-md border p-4">
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
          <Button type="submit" form="inspection-status-form" disabled={processing}>
            {processing ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
