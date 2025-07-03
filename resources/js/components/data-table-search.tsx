'use client';

import { Input } from '@/components/ui/input';
import { Table as TanstackTable } from '@tanstack/react-table';

// Define the props for the search component
interface DataTableSearchProps<TData> {
    table: TanstackTable<TData>;
    filterColumnId: string;
    placeholder?: string;
}

// The reusable search component
export function DataTableSearch<TData>({
    table,
    filterColumnId,
    placeholder,
}: DataTableSearchProps<TData>) {
    return (
        <Input
            placeholder={placeholder || 'Filter...'}
            value={(table.getColumn(filterColumnId)?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
                table.getColumn(filterColumnId)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px] shadow-2xl placeholder-gray-500"
        />
    );
}
