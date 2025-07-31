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
import * as React from 'react';
import { MachineStatus } from '../MachineStatus/Columns';

// Define the shape of the Behavior and TicketStatus data
export interface Behavior {
  id: number;
  name: string;
  title: string;
  description: string;
  pivot?: {
    // The pivot data for the relationship
    machine_status_id?: number;
  };
}

export interface TicketStatus {
  id: number;
  name: string;
  bg_color: string;
  text_color: string;
  behaviors: Behavior[];
}

// The function now accepts the sorting state and handler
export const getColumns = (
  onEdit: (status: TicketStatus) => void,
  onDelete: (status: TicketStatus) => void,
  onSort: (columnId: string, direction: 'asc' | 'desc' | null) => void,
  currentSort: { id: string; desc: boolean } | null,
  machineStatuses: MachineStatus[],
): ColumnDef<TicketStatus>[] => [
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
    accessorKey: 'behaviors',
    header: 'Behaviors',
    cell: ({ row }) => {
      const behaviors = row.original.behaviors;
      // ---  The cell now has the logic to find and display the machine status name ---
      const setsMachineStatusBehavior = behaviors.find((b) => b.name === 'sets_machine_status');
      const machineStatusId = setsMachineStatusBehavior?.pivot?.machine_status_id;
      const machineStatusName = machineStatuses.find((ms) => ms.id === machineStatusId)?.name;
      return (
        <div className="flex flex-wrap gap-1">
          {behaviors.map((behavior) => (
            <Badge key={behavior.id} className="bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {behavior.title}
              {behavior.name === 'sets_machine_status' && machineStatusName && `: ${machineStatusName} `}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const status = row.original;
      const [isOpen, setIsOpen] = React.useState(false);
      const canDelete = status.id !== 1;

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
              <DropdownMenuItem
                onSelect={() => {
                  onEdit(status);
                  setIsOpen(false);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem
                  onSelect={() => {
                    onDelete(status);
                    setIsOpen(false);
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
