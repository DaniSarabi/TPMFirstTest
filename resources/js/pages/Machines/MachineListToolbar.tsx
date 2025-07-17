import { Input } from '@/components/ui/input';
import * as React from 'react';
import { MachineStatusFilter } from './MachineStatusFilter';
import { MachineStatus } from './Columns';

//  Define the props for the toolbar
// We add types to ensure the component is used correctly.
interface MachineListToolbarProps {
    onSearch: (value: string) => void;
    createAction: React.ReactNode;
    statuses: MachineStatus[];
    statusFilterValues: Set<number>;
    onStatusFilterChange: (values: Set<number>) => void;
}

export function MachineListToolbar({ onSearch, createAction, statusFilterValues, onStatusFilterChange, statuses }: MachineListToolbarProps) {
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
