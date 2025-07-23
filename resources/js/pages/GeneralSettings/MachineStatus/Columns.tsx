'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import * as React from 'react';

// Define the shape of the MachineStatus data
export interface MachineStatus {
    id: number;
    name: string;
    description: string | null;
    bg_color: string;
    text_color: string;
}

// The function now accepts the sorting state and handler
export const getColumns = (
    onEdit: (status: MachineStatus) => void,
    onDelete: (status: MachineStatus) => void,
    onSort: (columnId: string, direction: 'asc' | 'desc' | null) => void,
    currentSort: { id: string; desc: boolean } | null
): ColumnDef<MachineStatus>[] => [
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" onSort={onSort} currentSort={currentSort} />,
    },
    {
        id: 'preview',
        header: 'Preview',
        cell: ({ row }) => {
            const status = row.original;
            return (
                <Badge
                    style={{
                        backgroundColor: status.bg_color,
                        color: status.text_color,
                    }}
                >
                    {status.name}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'description',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Description" onSort={onSort} currentSort={currentSort} />,
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const status = row.original;
            const canDelete = status.id !== 1;
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => { onEdit(status); setIsOpen(false); }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            {canDelete && (
                                <DropdownMenuItem onSelect={() => { onDelete(status); setIsOpen(false); }} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    },
];
