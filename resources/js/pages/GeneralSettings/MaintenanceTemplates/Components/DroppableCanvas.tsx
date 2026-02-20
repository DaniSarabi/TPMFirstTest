import { Button } from '@/components/ui/button';
import { LayoutItem } from '@/hooks/useTemplateLayout';
import { cn } from '@/lib/utils';
import { MaintenanceTemplate, MaintenanceTemplateSection, MaintenanceTemplateTask } from '@/types/maintenance';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Save } from 'lucide-react';
import { SortableSectionItem } from './SortableSectionItem';
import { SortableTaskItem } from './SortableTaskItem';

interface Props {
  template: MaintenanceTemplate;
  layoutItems: LayoutItem[];
  isDirty: boolean;
  isSaving: boolean;
  activeDragItem: any | null;
  onSave: () => void;
  onTaskChange: (taskId: number, updatedProperties: Partial<MaintenanceTemplateTask>) => void;
  onDeleteTask: (taskId: number) => void;
  onSectionChange: (sectionId: number, updatedProperties: Partial<MaintenanceTemplateSection>) => void;
  onDeleteSection: (sectionId: number) => void;
  // NEW: Add the move handler from the hook
  onMoveSection: (sectionId: number, direction: 'up' | 'down') => void;
}

export function DroppableCanvas({
  template,
  layoutItems,
  isDirty,
  isSaving,
  activeDragItem,
  onSave,
  onTaskChange,
  onDeleteTask,
  onSectionChange,
  onDeleteSection,
  onMoveSection, // Receive the handler
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'root-droppable-area' });

  const activeDragType = activeDragItem?.dndType;

  return (
    <div className="min-h-[500px] rounded-md border bg-card p-8 shadow-lg drop-shadow-lg">
      <div className="flex items-center justify-between border-b-2 border-primary pb-4">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight">{template.name}</h2>
          <p className="line-clamp-2 text-muted-foreground">{template.description}</p>
        </div>
        {isDirty && (
          <Button variant="secondary" onClick={onSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={cn('mt-8 min-h-[400px] rounded-lg border-2 border-dashed p-4 transition-colors', {
          'border-primary bg-muted/20': isOver,
          'border-muted-foreground/20': !isOver,
        })}
      >
        <SortableContext items={layoutItems.map((item) => item.id as string)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {layoutItems.length === 0 ? (
              <div className="flex h-full min-h-[300px] items-center justify-center">
                <p className="p-12 text-center text-sm text-muted-foreground">
                  Arrastra elementos desde la caja de herramientas para comenzar a construir.
                </p>
              </div>
            ) : (
              layoutItems.map((item, index) => {
                if (item.dndType === 'section') {
                  // Count how many sections we have to calculate isLast correctly
                  const sectionCount = layoutItems.filter((i) => i.dndType === 'section').length;
                  const currentSectionIndex = layoutItems.filter((i) => i.dndType === 'section').findIndex((s) => s.id === item.id);

                  return (
                    <SortableSectionItem
                      key={item.id} // key="section-1"
                      id={item.id as string}
                      section={item.data}
                      activeDragType={activeDragType}
                      onSectionChange={onSectionChange}
                      onDeleteSection={onDeleteSection}
                      onTaskChange={onTaskChange}
                      onDeleteTask={onDeleteTask}
                      // NEW: Wiring up the arrows
                      onMoveUp={() => onMoveSection(item.data.id, 'up')}
                      onMoveDown={() => onMoveSection(item.data.id, 'down')}
                      isFirst={currentSectionIndex === 0}
                      isLast={currentSectionIndex === sectionCount - 1}
                    />
                  );
                }
                return (
                  <SortableTaskItem
                    key={item.id} // key="task-1"
                    id={item.id as string}
                    task={item.data}
                    activeDragType={activeDragType}
                    onLabelChange={(taskId, label) => onTaskChange(taskId, { label })}
                    onDescriptionChange={(taskId, description) => onTaskChange(taskId, { description })}
                    onOptionChange={(taskId, optionKey, value) => onTaskChange(taskId, { options: { [optionKey]: value } })}
                    onDelete={onDeleteTask}
                  />
                );
              })
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
