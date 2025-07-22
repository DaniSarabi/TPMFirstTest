import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { type User as UserType } from '@/types';
import { CalendarIcon, Check, ChevronsUpDown, X } from 'lucide-react';
import * as React from 'react';
import { DateRange } from 'react-day-picker';

interface InspectionFiltersProps {
  showUserFilter: boolean;
  users: UserType[];
  selectedUser: number | null;
  onUserChange: (userId: number | null) => void;
  selectedDate: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  onReset: () => void;
  isFiltered: boolean;
}

export function InspectionFilters({
  showUserFilter,
  users,
  selectedUser,
  onUserChange,
  selectedDate,
  onDateChange,
  onReset,
  isFiltered,
}: InspectionFiltersProps) {
  const [userPopoverOpen, setUserPopoverOpen] = React.useState(false);

  return (
    <div className="flex items-center space-x-2">
      {/* Date Range Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 w-[240px] justify-start border-dashed text-left font-normal border-ring">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate?.from ? (
              selectedDate.to ? (
                <>
                  {new Date(selectedDate.from).toLocaleDateString()} - {new Date(selectedDate.to).toLocaleDateString()}
                </>
              ) : (
                new Date(selectedDate.from).toLocaleDateString()
              )
            ) : (
              <span>Filter by date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar initialFocus mode="range" defaultMonth={selectedDate?.from} selected={selectedDate} onSelect={onDateChange} numberOfMonths={2} />
        </PopoverContent>
      </Popover>

      {/* User Filter */}
      {showUserFilter && (
        <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={userPopoverOpen} className="h-9 w-[200px] justify-between border-dashed border-ring">
              {selectedUser ? users.find((user) => user.id === selectedUser)?.name : 'Filter by user...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search user..." />
              <CommandList>
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onUserChange(null);
                      setUserPopoverOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', !selectedUser ? 'opacity-100' : 'opacity-0')} />
                    All Users
                  </CommandItem>
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={String(user.id)}
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
          </PopoverContent>
        </Popover>
      )}

      {isFiltered && (
        <Button variant="ghost" onClick={onReset} className="h-9 px-2 lg:px-3">
          Reset
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
