'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

// --- Type Definitions for the Tickets Module ---
export interface TicketStatus {
  id: number;
  name: string;
  bg_color: string;
  text_color: string;
}
export interface InspectionItem {
    id: number;
    image_url: string | null;
}
export interface Ticket {
    id: number;
    title: string;
    description: string | null;
    priority: number;
    created_at: string;
    machine: {
        name: string;
        image_url: string | null;
    };
    creator: {
        name: string;
    };
    status: TicketStatus;
    inspection_item: InspectionItem | null;
}

// This function will be called from your Index page to generate the columns
export const getColumns = () // We will add handlers here later
: ColumnDef<Ticket>[] => [
  {
    accessorKey: 'id',
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
  },
  {
    accessorKey: 'machine',
    header: 'Machine',
    cell: ({ row }) => row.original.machine.name,
  },
  {
    accessorKey: 'creator',
    header: 'Created By',
    cell: ({ row }) => row.original.creator.name,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge style={{ backgroundColor: status.bg_color }} className="text-white">
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
                <Link href={route('tickets.show', ticket.id)}>View Details</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
