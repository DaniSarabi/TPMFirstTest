import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { type User as UserType } from '@/types';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import * as React from 'react';

interface Role {
  id: number;
  name: string;
}

interface UserRoleFilterProps {
  users: UserType[];
  roles: Role[];
  selectedUser: number | null;
  onUserChange: (userId: number | null) => void;
  selectedRole: string | null;
  onRoleChange: (role: string | null) => void;
}

export function UserRoleFilter({ users, roles, selectedUser, onUserChange, selectedRole, onRoleChange }: UserRoleFilterProps) {
  const [userPopoverOpen, setUserPopoverOpen] = React.useState(false);

  return (
    <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={userPopoverOpen}
          className="h-9 w-full justify-between border-dashed border-primary sm:w-[200px]"
        >
          <User />
          {selectedUser ? users.find((user) => user.id === selectedUser)?.name : 'Filter by user...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {/* ACTION: Se aumenta el ancho y se aplica el layout de dos columnas */}
      <PopoverContent variant="glass" className="w-[450px] border-border/50 bg-background/50 p-0 backdrop-blur-sm">
        <div className="flex">
          {/* Columna Izquierda: Roles */}
          <div className="flex flex-col gap-1 p-2">
            <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Roles</p>
            <Button
              size="sm"
              variant={!selectedRole ? 'secondary' : 'ghost'}
              onClick={() => onRoleChange(null)}
              className="h-8 justify-start text-xs"
            >
              All
            </Button>
            {roles.map((role) => (
              <Button
                key={role.id}
                size="sm"
                variant={selectedRole === role.name ? 'secondary' : 'ghost'}
                onClick={() => onRoleChange(role.name)}
                className="h-8 justify-start text-xs"
              >
                {role.name}
              </Button>
            ))}
          </div>
          {/* Columna Derecha: Usuarios */}
          <Command variant="glass" className="bg- flex-1 border-0 p-0 backdrop-blur-sm">
            <CommandInput placeholder="Search user..." />
            <CommandList>
              <CommandEmpty>No user found.</CommandEmpty>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.name}
                    onSelect={() => {
                      onUserChange(user.id);
                      setUserPopoverOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', selectedUser === user.id ? 'opacity-100' : 'opacity-0')} />
                    {user.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </PopoverContent>
    </Popover>
  );
}
