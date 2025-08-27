import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskType {
    id: string;
    label: string;
    icon: LucideIcon;
}

interface Props {
    task: TaskType;
}

export function DraggableTaskItem({ task }: Props) {
    // We only need isDragging to change the appearance, not transform
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id,
        data: { type: 'toolbox-item', task },
    });

    return (
        <div
            ref={setNodeRef}
            // By removing the `style` prop, the original item will no longer move.
            // It will now act purely as a drag handle that changes its own appearance.
            className={cn({
                'opacity-50': isDragging,
            })}
            {...listeners}
            {...attributes}
        >
            <Button variant="ghost" className="cursor-grab">
                <task.icon className="h-5 w-5" />
            </Button>
        </div>
    );
}
