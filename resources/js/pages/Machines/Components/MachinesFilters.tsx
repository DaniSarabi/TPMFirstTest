import { MoreFiltersPopover } from '@/components/MoreFiltersPopover';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';

// Se definen los tipos de datos que el componente espera
interface FilterOptions {
  tags: any[];
  statuses: string[];
}

interface MachineFiltersProps {
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  options: FilterOptions;
  onReset: () => void;
}

export function MachineFilters({ filters, onFilterChange, options, onReset }: MachineFiltersProps) {
  const isFiltered = Object.values(filters).some((v) => v !== null && v !== false && (!Array.isArray(v) || v.length > 0));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelectFilter
        title="Status"
        options={options.statuses.map((s) => ({ id: s, name: s.replace(/_/g, ' ') }))}
        selectedValues={new Set(filters.statuses || [])}
        onSelectedValuesChange={(values) => onFilterChange('statuses', Array.from(values))}
      />
      <MultiSelectFilter
        title="Tags"
        options={options.tags}
        selectedValues={new Set(filters.tags || [])}
        onSelectedValuesChange={(values) => onFilterChange('tags', Array.from(values))}
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
