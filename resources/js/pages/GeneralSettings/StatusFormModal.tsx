import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import * as React from 'react';

// --- ACTION 1: Define a generic Status type inside the component ---
// This makes the component reusable for any kind of status.
interface Status {
  id: number;
  name: string;
  description: string | null;
  bg_color: string;
  text_color: string;
}

// Define the props for the modal
interface StatusFormModalProps {
  status: Partial<Status> | null; // Use the generic Status type
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (form: any) => void; // A generic onSubmit handler
}

export function StatusFormModal({ status, isOpen, onOpenChange, onSubmit }: StatusFormModalProps) {
  const { data, setData, errors, processing, reset } = useForm({
    name: '',
    description: '',
    bg_color: '#000000',
    text_color: '#ffffff',
  });

  const isEditing = !!status?.id;

  // This useEffect hook resets the form when the modal opens
  React.useEffect(() => {
    if (isOpen) {
      reset();
      setData({
        name: status?.name || '',
        description: status?.description || '',
        bg_color: status?.bg_color || '#dcfce7',
        text_color: status?.text_color || '#166534',
      });
    }
  }, [isOpen, status]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Status' : 'Create Status'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for the "${status?.name}" status.` : 'Create a new status for your system.'}
          </DialogDescription>
        </DialogHeader>
        <form id="status-form" onSubmit={submit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
            <InputError message={errors.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} />
            <InputError message={errors.description} />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-4">
              <ColorPicker
                value={{ bgColor: data.bg_color, textColor: data.text_color }}
                // --- ACTION: Update the onChange handler ---
                // This is the correct way to update multiple fields with useForm.
                onChange={(colors) => {
                  setData('bg_color', colors.bgColor);
                  setData('text_color', colors.textColor);
                }}
              />{' '}
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

          {/* We will add the color palette picker here later */}
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
