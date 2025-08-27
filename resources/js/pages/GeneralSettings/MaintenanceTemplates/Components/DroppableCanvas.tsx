import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MaintenanceTemplate, MaintenanceTemplateTask } from '@/types/maintenance';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Save } from 'lucide-react';
import { SortableTaskItem } from './SortableTaskItem';

interface Props {
  template: MaintenanceTemplate;
  tasks: MaintenanceTemplateTask[];
  isDirty: boolean;
  isSaving: boolean;
  activeDragType: string | null;
  onSave: () => void;
  onLabelChange: (taskId: number, newLabel: string) => void;
  onDelete: (taskId: number) => void;
  onOptionChange: (taskId: number, option: string, value: any) => void;
  onDescriptionChange: (taskId: number, newDescription: string) => void;
}

export function DroppableCanvas({ template, tasks, isDirty, isSaving, activeDragType, onSave, onLabelChange, onDelete, onOptionChange, onDescriptionChange }: Props) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'canvas-droppable-area',
  });

  return (
    <div className="min-h-[500px] rounded-md border bg-white p-8 shadow-lg drop-shadow-lg dark:bg-gray-900">
      {/* Header Section inside the canvas */}
      <div className="flex items-center justify-between border-b-2 border-primary pb-4">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight">{template.name}</h2>
          <p className="line-clamp-2 text-muted-foreground">{template.description}</p>
        </div>
        {isDirty && (
          <Button className='bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground' onClick={onSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn('mt-8 rounded-lg transition-colors', {
          'border-primary ring-2 ring-primary/50': isOver,
        })}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length > 0 ? (
            <div className="dark:border-gray-600', h-full min-h-[400px] rounded-lg border-2 border-dashed border-primary p-2">
              {tasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  activeDragType={activeDragType}
                  onLabelChange={onLabelChange}
                  onDelete={onDelete}
                  onOptionChange={onOptionChange}
                  onDescriptionChange={onDescriptionChange}
                />
              ))}
            </div>
          ) : (
            <div
              className={cn(
                'flex h-full min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-center dark:border-gray-600',
              )}
            >
              <p className="text-muted-foreground">Drag an icon from the toolbox above to start building your form.</p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
