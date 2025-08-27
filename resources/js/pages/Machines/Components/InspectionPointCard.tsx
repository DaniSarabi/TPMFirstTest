import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InspectionPoint } from '@/types/machine';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface Props {
    point: InspectionPoint;
    onEdit: (point: InspectionPoint) => void;
    onDelete: (pointId: number) => void;
    can: { edit: boolean; delete: boolean };
}

export function InspectionPointCard({ point, onEdit, onDelete, can }: Props) {
    return (
        <div className="flex items-center justify-between rounded-md border p-4">
            <div>
                <p className="font-semibold">{point.name}</p>
                <p className="text-sm text-muted-foreground">{point.description || 'No description'}</p>
            </div>
            {(can.edit || can.delete) && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {can.edit && <DropdownMenuItem onClick={() => onEdit(point)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>}
                        {can.delete && <DropdownMenuItem onClick={() => onDelete(point.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
