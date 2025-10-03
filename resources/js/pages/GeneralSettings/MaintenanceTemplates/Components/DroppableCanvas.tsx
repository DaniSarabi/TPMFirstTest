import { Button } from '@/components/ui/button';
import { LayoutItem } from '@/hooks/useTemplateLayout';
import { cn } from '@/lib/utils';
import { MaintenanceTemplate, MaintenanceTemplateSection, MaintenanceTemplateTask } from '@/types/maintenance';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Save } from 'lucide-react';
import { SortableSectionItem } from './SortableSectionItem';
import { SortableTaskItem } from './SortableTaskItem';

// Interfaz de Props actualizada para incluir el item activo
interface Props {
  template: MaintenanceTemplate;
  layoutItems: LayoutItem[];
  isDirty: boolean;
  isSaving: boolean;
  activeDragItem: LayoutItem | null; // AÑADIDO: para saber qué se está arrastrando
  onSave: () => void;
  onTaskChange: (taskId: number, updatedProperties: Partial<MaintenanceTemplateTask>) => void;
  onDeleteTask: (taskId: number) => void;
  onSectionChange: (sectionId: number, updatedProperties: Partial<MaintenanceTemplateSection>) => void;
  onDeleteSection: (sectionId: number) => void;
}

export function DroppableCanvas({
  template,
  layoutItems,
  isDirty,
  isSaving,
  activeDragItem, // AÑADIDO
  onSave,
  onTaskChange,
  onDeleteTask,
  onSectionChange,
  onDeleteSection,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'root-droppable-area' });

  // Obtenemos el tipo del elemento que se está arrastrando
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
        <SortableContext items={layoutItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {/* AÑADIDO: Mensaje para el estado vacío */}
            {layoutItems.length === 0 ? (
              <div className="flex h-full min-h-[300px] items-center justify-center">
                <p className="p-12 text-center text-sm text-muted-foreground">
                  Arrastra elementos desde la caja de herramientas para comenzar a construir.
                </p>
              </div>
            ) : (
              layoutItems.map((item) => {
                if (item.dndType === 'section') {
                  return (
                    <SortableSectionItem
                      key={item.id}
                      section={item.data}
                      activeDragType={activeDragType}
                      onSectionChange={onSectionChange}
                      onDeleteSection={onDeleteSection}
                      onTaskChange={onTaskChange}
                      onDeleteTask={onDeleteTask}
                    />
                  );
                }
                return (
                  <SortableTaskItem
                    key={item.id}
                    task={item.data}
                    activeDragType={activeDragType}
                    // CAMBIADO: Adaptamos los handlers específicos al genérico onTaskChange
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
