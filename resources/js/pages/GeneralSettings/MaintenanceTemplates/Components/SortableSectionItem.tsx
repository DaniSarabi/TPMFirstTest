import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MaintenanceTemplateSection, MaintenanceTemplateTask } from '@/types/maintenance';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SortableTaskItem } from './SortableTaskItem';

const EditableSectionTitle = ({ value, onChange }: { value: string; onChange: (newValue: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  // Sincroniza el estado si la prop externa cambia
  useEffect(() => {
    setTitle(value);
  }, [value]);

  const handleSave = () => {
    if (value !== title) {
      onChange(title);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        className="flex-1 border-0 bg-transparent text-xl font-bold focus-visible:ring-1"
        // Evita que el drag se inicie al hacer click en el input
        onPointerDown={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <h3 onDoubleClick={() => setIsEditing(true)} className="flex-1 cursor-pointer truncate p-1 text-xl font-bold">
      {title || 'Untitled Section'}
    </h3>
  );
};

// CAMBIADO: La interfaz de Props ahora es más limpia y consistente.
interface Props {
  section: MaintenanceTemplateSection;
  isOverlay?: boolean;
  activeDragType?: string | null | undefined; // AÑADIDO: para pasarlo a los hijos
  onSectionChange: (sectionId: number, updatedProperties: Partial<MaintenanceTemplateSection>) => void;
  onDeleteSection: (sectionId: number) => void;
  // AÑADIDO: El handler genérico para tareas
  onTaskChange: (taskId: number, updatedProperties: Partial<MaintenanceTemplateTask>) => void;
  onDeleteTask: (taskId: number) => void;
  // REMOVIDO: tasks, onLabelChange, onDescriptionChange, onOptionChange
}

export function SortableSectionItem({
  section,
  isOverlay = false,
  activeDragType, // AÑADIDO
  onSectionChange,
  onDeleteSection,
  onTaskChange, // AÑADIDO
  onDeleteTask,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    // AÑADIDO: Pasamos la sección completa en data para el DragOverlay
    data: { type: 'section-item', section },
  });

  const { setNodeRef: droppableNodeRef, isOver: isOverContainer } = useDroppable({
    id: `section-droppable-${section.id}`,
    data: { type: 'section-droppable', sectionId: section.id },
  });

  // --- AÑADIDO: Hook para la nueva zona de drop en la parte inferior ---
  const { setNodeRef: bottomDropZoneRef, isOver: isOverBottomZone } = useDroppable({
    id: `section-drop-zone-${section.id}`, // ID único y predecible
    data: { type: 'section-drop-zone', sectionId: section.id },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.5 : 1, // Mejorado: no aplicar opacidad al overlay
    // AÑADIDO: Estilo para el overlay para que se vea por encima de todo
    ...(isOverlay && {
      boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.2)',
      zIndex: 50,
    }),
  };

  // CAMBIADO: Usamos section.tasks como la fuente de verdad
  const tasks = section.tasks || [];

  return (
    <div ref={setNodeRef} style={style} className="group rounded-lg bg-muted/30 p-4">
      {/* CAMBIADO: La estructura del header para permitir drag y edición */}
      <div className="mb-4 flex items-center gap-2">
        <div
          className="cursor-grab touch-none rounded p-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </div>

        <EditableSectionTitle value={section.title} onChange={(newTitle) => onSectionChange(section.id, { title: newTitle })} />

        <Button
          variant="ghost"
          size="sm"
          className="p-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
          onClick={() => onDeleteSection(section.id)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={droppableNodeRef}
        className={cn('min-h-[60px] rounded-md transition-all', {
          'bg-primary/5 shadow-inner': isOverContainer && !isOverBottomZone,
        })}
      >
        {/* CAMBIADO: El SortableContext ahora usa 'tasks' derivado de 'section' */}
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  // CAMBIADO: Pasamos el activeDragType y adaptamos los handlers
                  activeDragType={activeDragType}
                  onLabelChange={(taskId, label) => onTaskChange(taskId, { label })}
                  onDescriptionChange={(taskId, description) => onTaskChange(taskId, { description })}
                  onOptionChange={(taskId, optionKey, value) => onTaskChange(taskId, { options: { [optionKey]: value } })}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">Arrastra tareas aquí</p>
            </div>
          )}

        </SortableContext>
        {activeDragType && (
          <div
            ref={bottomDropZoneRef}
            className={cn(
              'mt-2 h-12 rounded-md border-2 border-dashed border-red-500 transition-all',
              'flex items-center justify-center text-sm text-muted-foreground',
              {
                'border-primary bg-primary/10 text-primary': isOverBottomZone,
                'mt-1 h-2 border-none': tasks.length === 0, // Se hace más pequeño si no hay tasks
              },
            )}
          >
            {isOverBottomZone ? 'Drop here' : 'Add to bottom'}
          </div>
        )}
      </div>
    </div>
  );
}
