'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import * as React from 'react'; // --- ACTION 1: Import React ---

// Define the shape of the MachineStatus data
export interface MachineStatus {
  id: number;
  name: string;
  description: string | null;
  bg_color: string;
  text_color: string;
}

// This function will be called from your Index page to generate the columns
export const getColumns = (onEdit: (status: MachineStatus) => void, onDelete: (id: number) => void): ColumnDef<MachineStatus>[] => [
  {
    accessorKey: 'id',
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
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
    id: 'actions',
    cell: ({ row }) => {
      const status = row.original;
      const canDelete = status.id !== 1;
      // --- ACTION 2: Add state to manually control the dropdown ---
      const [isOpen, setIsOpen] = React.useState(false);

      return (
        <div className="text-right">
          {/* --- ACTION 3: Connect the state to the DropdownMenu --- */}
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
              {/* --- ACTION 4: Update the onSelect handlers --- */}
              <DropdownMenuItem
                onSelect={() => {
                  onEdit(status);
                  setIsOpen(false); // Manually close the dropdown
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem
                  onSelect={() => {
                    onDelete(status.id);
                    setIsOpen(false); // Manually close the dropdown
                  }}
                  className="text-red-600"
                >
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
