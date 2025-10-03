import { Button } from '@/components/ui/button';
// ACTION: Se cambian las rutas de importación para que sean relativas y el compilador las encuentre.
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { MoreFiltersPopover } from '@/components/MoreFiltersPopover';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { UserRoleFilter } from '@/components/UserRoleFilter';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TicketStatus } from '@/types/ticket'; // Se importa el tipo TicketStatus
import { X } from 'lucide-react';
import * as React from 'react';

// Se definen los tipos de datos que el componente espera
interface FilterOptions {
  allMachines: any[];
  ticketStatuses: TicketStatus[];
  ticketCreators: any[];
  resolutionCategories: string[];
}

interface TicketFiltersProps {
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  options: FilterOptions;
  isFiltered: boolean | string | undefined;
  onReset: () => void;
}

export function TicketFilters({ filters, onFilterChange, options, isFiltered, onReset }: TicketFiltersProps) {
  const selectedStatuses = new Set<number>(filters.statuses || []);
  const view = filters.view || 'open';

  // basándose en la vista actual (Abiertos vs Todos).
  const availableStatuses = React.useMemo(() => {
    if (view === 'open') {
      return options.ticketStatuses.filter(
        (status) => !status.behaviors?.some((b) => b.name === 'is_ticket_closing_status' || b.name === 'is_ticket_discard_status'),
      );
    }
    return options.ticketStatuses;
  }, [view, options.ticketStatuses]);

  const showCategoryFilter = React.useMemo(() => {
    if (selectedStatuses.size === 0) return false;
    return options.ticketStatuses.some(
      (status) => selectedStatuses.has(status.id) && status.behaviors?.some((b) => b.name === 'is_ticket_closing_status'),
    );
  }, [selectedStatuses, options.ticketStatuses]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelectFilter
        title="Machine"
        options={options.allMachines}
        selectedValues={new Set(filters.machines || [])}
        onSelectedValuesChange={(values) => onFilterChange('machines', Array.from(values))}
      />
      <MultiSelectFilter
        title="Status"
        options={availableStatuses} // Se usa la lista de estatus ya filtrada
        selectedValues={selectedStatuses}
        onSelectedValuesChange={(values) => onFilterChange('statuses', Array.from(values))}
      />
      {showCategoryFilter && (
        <MultiSelectFilter
          title="Category"
          options={options.resolutionCategories.map((c) => ({ id: c, name: c }))}
          selectedValues={new Set<string | number>(filters.categories || [])}
          onSelectedValuesChange={(values) => onFilterChange('categories', Array.from(values))}
        />
      )}
      <DateRangeFilter
        selectedDate={
          filters.start_date ? { from: new Date(filters.start_date), to: filters.end_date ? new Date(filters.end_date) : undefined } : undefined
        }
        onDateChange={(range) => {
          onFilterChange('start_date', range?.from);
          onFilterChange('end_date', range?.to);
        }}
      />
      <MultiSelectFilter
        title="Priority"
        options={[
          { id: 1, name: 'Medium' },
          { id: 2, name: 'High' },
        ]}
        selectedValues={new Set(filters.priorities || [])}
        onSelectedValuesChange={(values) => onFilterChange('priorities', Array.from(values))}
      />
      <UserRoleFilter
        users={options.ticketCreators}
        roles={[]}
        selectedUser={filters.user}
        onUserChange={(value) => onFilterChange('user', value)}
        selectedRole={null}
        onRoleChange={() => {}}
      />
      <MoreFiltersPopover>
        <div className="flex items-center space-x-2">
          <Switch id="include-deleted" checked={filters.include_deleted} onCheckedChange={(value) => onFilterChange('include_deleted', value)} />
          <Label htmlFor="include-deleted">Include Deleted</Label>
        </div>
      </MoreFiltersPopover>

      {isFiltered && (
        <Button variant="ghost" onClick={onReset} className="h-9 px-2 lg:px-3">
          Reset
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
