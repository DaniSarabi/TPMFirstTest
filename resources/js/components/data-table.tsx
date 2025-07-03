'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils'; // Import the cn utility
import {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';
import { DataTablePagination } from './data-table-pagination';
import { DataTableSearch } from './data-table-search';
import { DataTableViewOptions } from './data-table-view-options';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterColumnId: string; // Optional prop to specify which column to filter
  filterPlaceholder: string; // Optional prop to specify the placeholder text for the filter input
  toolbarAction?: React.ReactNode; // Optional prop for additional toolbar actions
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactElement; // Optional prop for rendering subcomponents in expandable rows
  rowClassName?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumnId,
  filterPlaceholder,
  toolbarAction,
  renderSubComponent,
  rowClassName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const table = useReactTable({
    data,
    columns,
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true, // Allow all rows to be expandable
    //enableMultiRowExpansion: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,

    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      expanded,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between py-4">
        {/* //* Filtrar - busqueda */}
        <DataTableSearch
          table={table}
          filterColumnId={filterColumnId} // Cambia esto al ID de la columna que deseas filtrar
          placeholder={filterPlaceholder}
        />
        <div className="flex items-center justify-end space-x-2">
          {/* //*boton opcional */}
          {toolbarAction}
          {/* //* Visibilidad */}
          <DataTableViewOptions table={table} />
        </div>
      </div>
      <div className="overflow-auto rounded-md border">
        <Table>
          <TableHeader className="bg-background sticky top-0 z-10 shadow-md font-bold">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow 
              className='h-15'
              key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                    className='text-base'
                    key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                //  Render the main row and the expanded sub-row ---
                <React.Fragment key={row.id}>
                  <TableRow 
                  data-state={row.getIsSelected() && 'selected'} 
                  className={
                    cn(
                      row.getIsExpanded() && 'bg-gray-200',
                      rowClassName
                      )}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                  {/* If the row is expanded and a sub-component renderer is provided, render it */}
                  {row.getIsExpanded() && renderSubComponent && (
                    <TableRow>
                      <TableCell
                       colSpan={row.getVisibleCells().length}
                       >
                        <div className='overflow-hidden animate-in fade-in-0 slide-in-from-top-1 duration-300'>
                          {renderSubComponent({ row })}
                          </div>

                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        {/* //* Paginacion*/}
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
