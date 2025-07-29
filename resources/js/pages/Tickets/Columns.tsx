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
import { AlertTriangle, Eye, MoreHorizontal, ShieldAlert } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { MachineStatus } from '../GeneralSettings/MachineStatus/Columns';

// --- Type Definitions for the Tickets Module ---
// These must match the data sent from the TicketController

export interface TicketStatus {
    id: number;
    name: string;
    bg_color: string;
    text_color: string;
}

export interface User {
    id: number;
    name: string;
}

export interface Subsystem {
    id: number;
    name: string;
}

export interface InspectionPoint {
    id: number;
    name: string;
    subsystem: Subsystem;
}

export interface InspectionReportItem {
    id: number;
    image_url: string | null;
    point: InspectionPoint;
}

export interface Machine {
    id: number;
    name: string;
    image_url: string | null;
    machine_status: { name: string; };
}

export interface TicketUpdate {
    id: number;
    comment: string | null;
    action_taken: string | null;
    parts_used: string | null;
    created_at: string;
    user: User;
    old_status: TicketStatus | null;
    new_status: TicketStatus | null;
    new_machine_status_id: number | null;
    new_machine_status: MachineStatus | null;
}

export interface Ticket {
    id: number;
    title: string;
    description: string | null;
    priority: number;
    created_at: string;
    creator: User;
    machine: Machine;
    status: TicketStatus;
    inspection_item: InspectionReportItem | null;
    updates: TicketUpdate[];
    solved_by: User |null;
}

// This function will be called from your Index page to generate the columns
export const getColumns = (
    can: { edit: boolean; delete: boolean },
    onSort: (columnId: string, direction: 'asc' | 'desc' | null) => void,
    currentSort: { id: string; desc: boolean } | null
): ColumnDef<Ticket>[] => [
    {
        accessorKey: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title="ID" onSort={onSort} currentSort={currentSort} />,
    },
    {
        accessorKey: 'description',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Description" onSort={onSort} currentSort={currentSort} />,
          cell: ({ row }) => <span className="line-clamp-2">{row.original.description}</span>,
    },
    {
        accessorKey: 'machine.name',
        header: 'Machine',
    },
    {
        accessorKey: 'creator.name',
        header: 'Created By',
    },
    {
        accessorKey: 'priority',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" onSort={onSort} currentSort={currentSort} />,
        cell: ({ row }) => {
            const priority = row.original.priority;
            if (priority === 2) {
                return <div className="flex items-center gap-2 text-red-600 text-lg" ><ShieldAlert className="h-6 w-6" /> Critical</div>;
            }
            if (priority === 1) {
                return <div className="flex items-center gap-2 text-yellow-600 text-lg"><AlertTriangle className="h-6 w-6" /> Needed</div>;
            }
            return <span className="text-muted-foreground">Low</span>;
        },
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.status;
            return (
                <Badge className='text-md' style={{ backgroundColor: status.bg_color , color: status.text_color }}>
                    {status.name}
                </Badge>
            );
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const ticket = row.original;
            return (
                <div className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <div>

                              <Eye/>
                                <Link href={route('tickets.show', ticket.id)}>View Details</Link>
                              </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    },
];
