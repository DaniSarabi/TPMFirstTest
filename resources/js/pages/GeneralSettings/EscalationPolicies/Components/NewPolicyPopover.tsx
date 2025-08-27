import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { PlusCircle, Save } from 'lucide-react';
import React, { useState } from 'react';

export function NewPolicyPopover() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('settings.escalation-policies.store'), {
      onSuccess: () => {
        setIsPopoverOpen(false);
        reset();
      },
    });
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Policy
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 border-0 shadow drop-shadow-lg">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="leading-none font-medium">Create New Policy</h4>
              <p className="text-sm text-muted-foreground">Give your new policy a name and description.</p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="col-span-2 h-8 ring ring-ring" />
              </div>
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  className="col-span-2 ring ring-ring"
                />
              </div>
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>
            <Button className='hover:bg-secondary' type="submit" disabled={processing}>
              <Save className='h-4 w-4' />
              {processing ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
