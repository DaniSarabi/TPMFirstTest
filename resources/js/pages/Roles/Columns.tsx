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
import { Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

interface Permission {
    id: number;
    name: string;
}

export interface Role {
    id: number;
    name: string;
    permissions: Permission[];
}

// This function will be called from your Index page to generate the columns
export const getColumns = (can: { edit: boolean; delete: boolean }, handleDelete: (id: number) => void): ColumnDef<Role>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
    enableSorting: false,
    enableHiding: false,
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
    accessorKey: 'permissions',
    header: 'Permissions',
    cell: ({ row }) => {
      const permissions = row.original.permissions;
      return (
        <div className="flex flex-wrap gap-1">
          {permissions.map((permission) => (
            <span
              key={permission.id}
              className="rounded bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300"
            >
              {permission.name}
            </span>
          ))}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const role = row.original;

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
              <Link href={route('roles.show', role.id)}>View Details</Link>
            </DropdownMenuItem>
            {can.edit && (
              <DropdownMenuItem asChild>
                <Link href={route('roles.edit', role.id)}>Edit Role</Link>
              </DropdownMenuItem>
            )}
            {can.delete && <DropdownMenuItem onClick={() => handleDelete(role.id)}>Delete role</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
