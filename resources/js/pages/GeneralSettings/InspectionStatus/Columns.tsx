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
import { MoreHorizontal, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import * as React from 'react';
import { MachineStatus } from '../MachineStatus/Columns';

// Define the shape of the InspectionStatus data
export interface InspectionStatus {
    id: number;
    name: string;
    severity: number;
    auto_creates_ticket: boolean;
    machine_status_id: number | null;
    machine_status: {
        name: string;
    } | null;
    bg_color: string;
    text_color: string;
    is_default: boolean;
}

// This function will be called from your Index page to generate the columns
export const getColumns = (
    onEdit: (status: InspectionStatus) => void,
    onDelete: (status: InspectionStatus) => void,
    onSort: (columnId: string, direction: 'asc' | 'desc' | null) => void,
    currentSort: { id: string; desc: boolean } | null
): ColumnDef<InspectionStatus>[] => [
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
        accessorKey: 'severity',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Severity" onSort={onSort} currentSort={currentSort} />,
    },
    {
        accessorKey: 'auto_creates_ticket',
        header: 'Creates Ticket?',
        cell: ({ row }) => {
            const createsTicket = row.original.auto_creates_ticket;
            return createsTicket ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
            );
        },
    },
    {
        accessorKey: 'sets_machine_status_to',
        header: 'Sets Machine Status To',
        cell: ({ row }) => {
            return row.original.machine_status?.name || <span className="text-muted-foreground">N/A</span>;
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const status = row.original;
            const canDelete = !status.is_default;
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
