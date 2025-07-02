'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';

import { Link } from '@inertiajs/react';

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
        <Button variant="ghost" size="icon" onClick={row.getToggleExpandedHandler()} className="h-8 w-8 p-0">
          {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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
    id: 'subsystems',
    header: 'Subsystems',
    cell: ({ row }) => {
      // Display the number of subsystems for each machine
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
                <Link href={route('machines.edit', machine.id)} >Edit Machine</Link>
              </DropdownMenuItem>
            )}
            {can.delete && <DropdownMenuItem onClick={() => handleDelete(machine.id)} className='text-red-600'>Delete Machine</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
