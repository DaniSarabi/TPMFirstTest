import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MaintenanceTemplate } from '@/types/maintenance';
import { useForm } from '@inertiajs/react';
import { CircleX, Send } from 'lucide-react';
import React from 'react';

interface Props {
  // The template to edit, or null if creating a new one
  template: Partial<MaintenanceTemplate> | null;
  // Callback to cancel the form and go back to the viewing state
  onCancel: () => void;
}

export function MaintenanceTemplateForm({ template, onCancel }: Props) {
  const isEditing = template && 'id' in template;

  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || '',
  });

  React.useEffect(() => {
    // Reset the form when the template prop changes
    reset();
    setData({
      name: template?.name || '',
      description: template?.description || '',
      category: template?.category || '',
    });
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const onSuccess = () => onCancel(); // On success, go back to the view state

    if (isEditing) {
      put(route('settings.maintenance-templates.update', template.id!), { onSuccess });
    } else {
      post(route('settings.maintenance-templates.store'), { onSuccess });
    }
  };

  return (
    <Card className="transition-500 shadow-lg drop-shadow-lg transition-transform ease-in-out hover:-translate-1">
      <form onSubmit={handleSubmit} autoComplete="off">
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Template Details' : 'Create New Template'}</CardTitle>
          <CardDescription>Fill in the basic details below. You can add tasks after the template is saved.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              className="shadow ring ring-ring drop-shadow-lg"
              id="name"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="e.g., Monthly Pump Inspection"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category / Folder</Label>
            <Input
              className="shadow ring ring-ring drop-shadow-lg"
              id="category"
              value={data.category}
              onChange={(e) => setData('category', e.target.value)}
              placeholder="e.g., Huber, Hv"
            />
            {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              className="shadow ring ring-ring drop-shadow-lg"
              id="description"
              value={data.description || ''}
              onChange={(e) => setData('description', e.target.value)}
              placeholder="A brief description of what this template is for."
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            <CircleX className="h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={processing}>
            <Send className="h-4 w-4" />
            {processing ? 'Saving...' : 'Save Template'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
