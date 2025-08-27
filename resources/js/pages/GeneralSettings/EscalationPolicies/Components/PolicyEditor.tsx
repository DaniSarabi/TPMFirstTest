import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { EmailContact } from '@/types';
import { EscalationLevel, EscalationPolicy } from '@/types/escalation';
import { router, useForm } from '@inertiajs/react';
import { MoreHorizontal, PlusCircle, Save, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  policy: EscalationPolicy;
  contacts: EmailContact[];
}

export function PolicyEditor({ policy, contacts }: Props) {
  const [levelToEdit, setLevelToEdit] = useState<EscalationLevel | null>(null);
  const { data, setData, reset } = useForm({ days_after: 0 });

  const handleAddLevel = () => {
    router.post(
      route('settings.escalation-levels.store'),
      {
        escalation_policy_id: policy.id,
        days_after: data.days_after,
      },
      {
        onSuccess: () => reset('days_after'),
        preserveScroll: true,
      },
    );
  };

  const handleUpdateLevel = (levelId: number) => {
    router.put(
      route('settings.escalation-levels.update', levelId),
      {
        days_after: data.days_after,
      },
      {
        onSuccess: () => setLevelToEdit(null),
        preserveScroll: true,
      },
    );
  };

  const handleDeleteLevel = (levelId: number) => {
    if (confirm('Are you sure you want to delete this level?')) {
      router.delete(route('settings.escalation-levels.destroy', levelId), { preserveScroll: true });
    }
  };

  const handleToggleContact = (level: EscalationLevel, contactId: number) => {
    const currentContactIds = level.email_contacts.map((c) => c.id);
    const newContactIds = currentContactIds.includes(contactId)
      ? currentContactIds.filter((id) => id !== contactId)
      : [...currentContactIds, contactId];

    router.post(
      route('settings.escalation-levels.sync-contacts', level.id),
      {
        contact_ids: newContactIds,
      },
      { preserveScroll: true },
    );
  };

  return (
    <Card className="border-0 bg-background shadow-lg drop-shadow-lg">
      <CardHeader>
        <CardTitle className="font-semibold text-primary">{policy.name}</CardTitle>
        <CardDescription>{policy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {policy.levels.map((level) => {
          const isEditing = levelToEdit?.id === level.id;
          return (
            <div key={level.id} className="rounded-md border-0 bg-card p-4 shadow-lg drop-shadow-lg">
              <div className="flex items-center justify-between">
                {isEditing ? (
                  // --- VISTA DE EDICIÓN ---
                  <div className="flex w-full items-center gap-2">
                    <Label>Notify after</Label>
                    <Input
                      type="number"
                      className="h-8 w-20 ring ring-ring"
                      value={data.days_after}
                      onChange={(e) => setData('days_after', parseInt(e.target.value) || 0)}
                    />
                    <Label>days</Label>
                    <div className="ml-auto flex gap-2">
                      <Button size="sm" onClick={() => handleUpdateLevel(level.id)}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setLevelToEdit(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // --- VISTA NORMAL ---
                  <>
                    <h4 className="font-semibold">
                      Level {level.level}: Notify after {level.days_after} days
                    </h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onSelect={() => {
                            setLevelToEdit(level);
                            setData('days_after', level.days_after);
                          }}
                        >
                          Edit Level
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDeleteLevel(level.id)} className="text-destructive">
                          Delete Level
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
              <Separator className="my-4 border border-primary" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Notify:</p>
                <div className="flex flex-wrap items-center gap-2">
                  {level.email_contacts.map((contact) => (
                    <Badge key={contact.id} variant="secondary" className="flex items-center gap-1">
                      {contact.name}
                      <button onClick={() => handleToggleContact(level, contact.id)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-6 rounded-full">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0">
                      <Command>
                        <CommandInput placeholder="Search contact..." />
                        <CommandList>
                          <CommandEmpty>No contacts found.</CommandEmpty>
                          <CommandGroup>
                            {contacts.map((contact) => (
                              <CommandItem key={contact.id} onSelect={() => handleToggleContact(level, contact.id)}>
                                {contact.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          );
        })}
        <div className="flex justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Level
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="space-y-2">
                <Label htmlFor="days_after">Days After Due Date</Label>
                <Input id="days_after" type="number" value={data.days_after} onChange={(e) => setData('days_after', parseInt(e.target.value) || 0)} />
                <Button onClick={handleAddLevel} size="sm">
                  Save Level
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}
