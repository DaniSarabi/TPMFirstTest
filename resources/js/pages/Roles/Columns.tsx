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
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import * as React from 'react';

// Define the shape of the Permission and Role to match your real data
interface Permission {
    id: number;
    name: string;
}

export interface Role {
    id: number;
    name: string;
    permissions: Permission[];
}
export const permissionColorMap: Record<string, string> = {
    users: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    roles: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
    machines: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    inspections: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
    tickets: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'email-contacts': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

// --- Create a helper function to get the correct color class ---
export const getPermissionColor = (permissionName: string): string => {
    const prefix = permissionName.split('.')[0];
    return permissionColorMap[prefix] || permissionColorMap.default;
};

// The function now accepts the sorting state and handler
export const getColumns = (
    can: { edit: boolean; delete: boolean },
    handleDelete: (id: number) => void,
    onSort: (columnId: string, direction: 'asc' | 'desc' | null) => void,
    currentSort: { id: string; desc: boolean } | null
): ColumnDef<Role>[] => [
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="ID" onSort={onSort} currentSort={currentSort} />,
    },
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" onSort={onSort} currentSort={currentSort} />,
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
                            className={cn('rounded px-2.5 py-0.5 text-xs font-medium', getPermissionColor(permission.name))}
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
            const [isOpen, setIsOpen] = React.useState(false);
            return (
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
                        {can.edit && (
                            <DropdownMenuItem onSelect={() => router.get(route('roles.edit', role.id))}>Edit Role</DropdownMenuItem>
                        )}
                        {can.delete && <DropdownMenuItem onSelect={() => handleDelete(role.id)}>Delete Role</DropdownMenuItem>}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
