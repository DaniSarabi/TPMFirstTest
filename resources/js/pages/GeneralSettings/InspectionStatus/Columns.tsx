'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DynamicLucideIcon from '@/components/dynamicIconHelper';
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
import { getContrastColor } from '@/lib/tpm-helpers';
import { Tag } from '@/types/maintenance'; // Importar el tipo Tag
import { InspectionStatus } from '@/types/settings'; // Importar desde el nuevo archivo de tipos
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import * as React from 'react';

export const getColumns = (
  onEdit: (status: InspectionStatus) => void,
  onDelete: (status: InspectionStatus) => void,
  onSort: (columnId: string, direction: 'asc' | 'desc' | null) => void,
  currentSort: { id: string; desc: boolean } | null,
  tags: Tag[], // Recibir la lista de tags
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
    accessorKey: 'behaviors',
    header: 'Behaviors',
    cell: ({ row }) => {
      const behaviors = row.original.behaviors;

      // --- ACTION: Refactored logic to render styled badges ---
      return (
        <div className="flex flex-wrap gap-1">
          {behaviors.map((behavior, index) => {
            // Case 1: This is a behavior that applies a tag.
            if (behavior.name === 'applies_machine_tag') {
              const tagId = behavior.pivot?.tag_id;
              const tag = tags.find((t) => t.id === tagId);

              // If we found the tag, render the styled badge.
              if (tag) {
                return (
                  <Badge
                    key={`${behavior.id}-${tag.id}-${index}`}
                    className="flex items-center gap-1.5 text-xs capitalize"
                    style={{
                      backgroundColor: tag.color,
                      color: getContrastColor(tag.color),
                    }}
                  >
                    <DynamicLucideIcon name={tag.icon} className="h-3 w-3" />
                    Tag:
                    <span>{tag.name}</span>
                  </Badge>
                );
              }
              // If tag not found, render nothing for this rule.
              return null;
            }

            // Case 2: This is a simple behavior (like "Creates Ticket").
            return (
              <Badge key={`${behavior.id}-${index}`} variant="secondary">
                {behavior.title}
              </Badge>
            );
          })}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const status = row.original;
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
              <DropdownMenuItem
                onSelect={() => {
                  onEdit(status);
                  setIsOpen(false);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  onDelete(status);
                  setIsOpen(false);
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
