'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@radix-ui/react-separator';
import {
    ColumnDef,
    flexRender,
    // We no longer need useReactTable here, as the instance is created in the parent
    Table as TanstackTable, // Rename to avoid conflict with our Table component
} from '@tanstack/react-table';
import * as React from 'react';

// ---  Update the props to accept the table instance ---
interface DataTableProps<TData> {
    table: TanstackTable<TData>;
    columns: ColumnDef<TData, any>[]; // Keep columns for the colspan calculation
}

export function DataTable<TData>({ table, columns }: DataTableProps<TData>) {
    return (
        <div className="rounded-md border-0 ">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
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
    );
}
