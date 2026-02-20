import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MaintenanceTemplateSection } from '@/types/maintenance';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
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
  id: string; // The dndId (e.g. "section-1")
  section: MaintenanceTemplateSection;
  activeDragType?: string | null;
  onSectionChange: (sectionId: number, val: any) => void;
  onDeleteSection: (sectionId: number) => void;
  onTaskChange: (taskId: number, val: any) => void;
  onDeleteTask: (taskId: number) => void;
  // NEW PROPS
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function SortableSectionItem({
  id,
  section,
  activeDragType,
  onSectionChange,
  onDeleteSection,
  onTaskChange,
  onDeleteTask,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: Props) {
  const { setNodeRef: droppableNodeRef, isOver } = useDroppable({
    id: id, // Use the string ID for the drop container
    data: { type: 'section-container', id: section.id },
  });

  // CAMBIADO: Usamos section.tasks como la fuente de verdad
  const tasks = section.tasks || [];

  return (
    <div className="group mb-4 rounded-lg border bg-muted/30 p-4 transition-all hover:bg-muted/50">
      <div className="mb-4 flex items-center gap-2">
        {/* NEW: Arrow Controls instead of Drag Handle */}
        <div className="flex flex-col gap-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp} disabled={isFirst}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown} disabled={isLast}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        <EditableSectionTitle value={section.title} onChange={(newTitle) => onSectionChange(section.id, { title: newTitle })} />

        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-muted-foreground hover:text-destructive"
          onClick={() => onDeleteSection(section.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={droppableNodeRef}
        className={cn('min-h-[60px] rounded-md transition-all', {
          'bg-primary/5 shadow-inner ring-1 ring-primary/20': isOver,
        })}
      >
        <SortableContext items={tasks.map((t) => `task-${t.id}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 p-2">
            {tasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                id={`task-${task.id}`} // Ensure string ID
                task={task}
                activeDragType={activeDragType}
                onLabelChange={(tid, v) => onTaskChange(tid, { label: v })}
                onDescriptionChange={(tid, v) => onTaskChange(tid, { description: v })}
                onOptionChange={(tid, k, v) => onTaskChange(tid, { options: { [k]: v } })}
                onDelete={onDeleteTask}
              />
            ))}
            {tasks.length === 0 && <div className="py-8 text-center text-xs text-muted-foreground">Drop tasks here</div>}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
