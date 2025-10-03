import { DateRangeFilter } from '@/components/DateRangeFilter';
import { MoreFiltersPopover } from '@/components/MoreFiltersPopover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UserRoleFilter } from '@/components/UserRoleFilter';
import { type User as UserType } from '@/types';
import { X } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface Role {
  id: number;
  name: string;
}

interface InspectionFiltersProps {
  showUserFilter: boolean;
  users: UserType[];
  roles: Role[];
  selectedUser: number | null;
  onUserChange: (userId: number | null) => void;
  selectedDate: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  onReset: () => void;
  isFiltered: boolean;
  includeDeleted: boolean;
  onIncludeDeletedChange: (checked: boolean) => void;
  selectedRole: string | null;
  onRoleChange: (role: string | null) => void;
}

export function InspectionFilters({
  showUserFilter,
  users,
  roles,
  selectedUser,
  onUserChange,
  selectedDate,
  onDateChange,
  onReset,
  isFiltered,
  includeDeleted,
  onIncludeDeletedChange,
  selectedRole,
  onRoleChange,
}: InspectionFiltersProps) {
  return (
    <div className="flex flex-row items-center gap-2">
      {/* --- Date Range Filter --- */}
      <DateRangeFilter selectedDate={selectedDate} onDateChange={onDateChange}></DateRangeFilter>
      {/* --- User & Role Filter --- */}
      {showUserFilter && (
        <UserRoleFilter
          users={users}
          roles={roles}
          selectedUser={selectedUser}
          onUserChange={onUserChange}
          selectedRole={selectedRole}
          onRoleChange={onRoleChange}
        ></UserRoleFilter>
      )}

      {/* Popover para filtros adicionales */}
      <MoreFiltersPopover>
        <div className="flex items-center space-x-2">
          <Switch id="include-deleted" checked={includeDeleted} onCheckedChange={onIncludeDeletedChange} />
          <Label htmlFor="include-deleted" className="text-sm font-medium whitespace-nowrap">
            Include Deleted
          </Label>
        </div>
      </MoreFiltersPopover>

      {isFiltered && (
        <Button variant="ghost" onClick={onReset} className="h-9 px-2 hover:bg-destructive/80 hover:text-destructive-foreground lg:px-3">
          Reset
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
