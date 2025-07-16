import { Input } from '@/components/ui/input';
import * as React from 'react';
import { MachineStatusFilter, statuses } from './MachineStatusFilter';

//  Define the props for the toolbar
// We add types to ensure the component is used correctly.
interface MachineListToolbarProps {
  onSearch: (value: string) => void;
  createAction: React.ReactNode;
  // Add props to manage the status filter ---
  statusFilterValues: Set<string>;
  onStatusFilterChange: (values: Set<string>) => void;
}

export function MachineListToolbar({ onSearch, createAction, statusFilterValues, onStatusFilterChange }: MachineListToolbarProps) {
  return (
    <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <Input
                    placeholder="Filter machines by name..."
                    className="max-w-sm ring-ring ring-1 hover:bg-accent hover:text-accent-foreground"
                    onChange={(e) => onSearch(e.target.value)}
                />
                <MachineStatusFilter
                    title="Status"
                    options={statuses}
                    selectedValues={statusFilterValues}
                    onSelectedValuesChange={onStatusFilterChange}
                    
                />
            </div>
            {createAction}
        </div>
  );
}
