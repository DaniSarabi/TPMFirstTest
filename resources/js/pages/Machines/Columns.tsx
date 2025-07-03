'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';

// Define the shape of the data to match what your controller sends
// This includes the nested relationships for subsystems and inspection points
interface Subsystem {
  id: number;
  name: string;
  inspection_points: { id: number }[]; // We only need the ID for counting
}

export interface Machine {
  id: number;
  name: string;
  description: string;
  status: 'New' | 'In Service' | 'Under Maintenance' | 'Out of Service';
  subsystems: Subsystem[];
}

// This function will be called from your Index page to generate the columns
export const getColumns = (can: { edit: boolean; delete: boolean }, handleDelete: (id: number) => void): ColumnDef<Machine>[] => [
  // This column will display the button to expand or collapse the row.
  {
    id: 'expander',
    header: () => null, // No header text for this column
    cell: ({ row }) => {
      // Check if the row can be expanded (i.e., if it has subsystems)
      return row.getCanExpand() ? (
        <Button variant="ghost" size="icon" onClick={row.getToggleExpandedHandler()} className="h-8 w-8 p-0 bg-accent">
          {row.getIsExpanded() ? <ChevronDown className="h-4 w-4 " /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      ) : null;
    },
  },

  {
    accessorKey: 'id',
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;

      // Define the color classes based on the status value
      const statusColor = {
        'In Service': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        'Under Maintenance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        'Out of Service': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        New: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      }[status];

      return <span className={cn('rounded px-3 py-1 text-sm ', statusColor)}>{status}</span>;
    },
  },
  {
    id: 'subsystems',
    header: 'Subsystems',
    cell: ({ row }) => {
      const subsystemCount = row.original.subsystems.length;
      return <div className="text-center">{subsystemCount}</div>;
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const machine = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={route('machines.show', machine.id)}>View Details</Link>
            </DropdownMenuItem>
            {can.edit && (
              <DropdownMenuItem asChild>
                <Link href={route('machines.edit', machine.id)}>Edit Machine</Link>
              </DropdownMenuItem>
            )}
            {can.delete && (
              <DropdownMenuItem onClick={() => handleDelete(machine.id)} className="text-red-600">
                Delete Machine
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
