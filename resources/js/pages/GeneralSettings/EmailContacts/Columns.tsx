'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import * as React from 'react';

// Define the shape of the EmailContact data
export interface EmailContact {
    id: number;
    name: string;
    email: string;
    department: string;
}

// The function now accepts the sorting state and handler
export const getColumns = (
    onEdit: (contact: EmailContact) => void,
    onDelete: (contact: EmailContact) => void,
    onSort: (columnId: string, direction: 'asc' | 'desc' | null) => void,
    currentSort: { id: string; desc: boolean } | null
): ColumnDef<EmailContact>[] => [
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" onSort={onSort} currentSort={currentSort} />,
    },
    {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" onSort={onSort} currentSort={currentSort} />,
    },
    {
        accessorKey: 'department',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Department" onSort={onSort} currentSort={currentSort} />,
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const contact = row.original;
            const [isOpen, setIsOpen] = React.useState(false);

            return (
                <div className="text-right">
                    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => { onEdit(contact); setIsOpen(false); }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { onDelete(contact); setIsOpen(false); }} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    },
];
