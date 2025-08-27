import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Machine, Subsystem, InspectionPoint } from '@/types/machine';
import { MoreVertical, Pencil, Trash2, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InspectionPointCard } from './InspectionPointCard';

interface Props {
    machine: Machine;
    onDelete: (id: number) => void;
    onEdit: (subsystem: Subsystem) => void;
    onManagePoints: (subsystem: Subsystem) => void;
    can: { create: boolean; edit: boolean; delete: boolean };
}

export function SubsystemAccordion({ machine, onDelete, onEdit, onManagePoints, can }: Props) {
    // We'll need handlers for the new inspection point cards
    const handleEditPoint = (point: InspectionPoint) => {
        // This will likely open a new modal, we can wire it up later
        console.log('Editing point:', point.name);
    };

    const handleDeletePoint = (pointId: number) => {
        // This will call the router to delete the point
        console.log('Deleting point ID:', pointId);
    };

    return (
        <Accordion type="multiple" className="w-full">
            {machine.subsystems.map((subsystem) => (
                <AccordionItem key={subsystem.id} value={`subsystem-${subsystem.id}`}>
                    <div className="flex items-center pr-4 hover:bg-muted/50">
                        <AccordionTrigger className="flex-grow p-4 text-left font-semibold">
                            {subsystem.name}
                        </AccordionTrigger>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {can.edit && <DropdownMenuItem onClick={() => onManagePoints(subsystem)}><Eye className="mr-2 h-4 w-4" />Manage Points</DropdownMenuItem>}
                                {can.edit && <DropdownMenuItem onClick={() => onEdit(subsystem)}><Pencil className="mr-2 h-4 w-4" />Edit Subsystem</DropdownMenuItem>}
                                {can.delete && <DropdownMenuItem onClick={() => onDelete(subsystem.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete Subsystem</DropdownMenuItem>}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <AccordionContent className="bg-muted/50 p-4">
                        <div className="space-y-2">
                            {subsystem.inspection_points.length > 0 ? (
                                subsystem.inspection_points.map((point) => (
                                    <InspectionPointCard
                                        key={point.id}
                                        point={point}
                                        onEdit={handleEditPoint}
                                        onDelete={handleDeletePoint}
                                        can={can}
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No inspection points have been added to this subsystem yet.</p>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
