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
export function DataTableSearch<TData>({ table, filterColumnId, placeholder }: DataTableSearchProps<TData>) {
  return (
    <Input
      className="h-8 w-[150px] placeholder-gray-500 shadow-2xl ring-1 ring-ring lg:w-[250px]"
      placeholder={placeholder || 'Filter...'}
      value={(table.getColumn(filterColumnId)?.getFilterValue() as string) ?? ''}
      onChange={(event) => table.getColumn(filterColumnId)?.setFilterValue(event.target.value)}
    />
  );
}
