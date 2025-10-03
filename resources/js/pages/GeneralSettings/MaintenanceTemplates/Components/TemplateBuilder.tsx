import { MaintenanceTemplate } from '@/types/maintenance';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useState } from 'react';

// Importa nuestro custom hook y los componentes
import { useTemplateLayout } from '@/hooks/useTemplateLayout';
import { DroppableCanvas } from './DroppableCanvas';
import { SortableSectionItem } from './SortableSectionItem';
import { SortableTaskItem } from './SortableTaskItem';
import { TaskToolbox } from './TaskToolbox';
import { ToolboxDragOverlayItem } from './ToolboxDragOverlayItem';

interface Props {
  template: MaintenanceTemplate;
}

export function TemplateBuilder({ template }: Props) {
  // AÑADIDO: El estado de 'isDirty' ahora vive en este componente padre.
  const [isDirty, setIsDirty] = useState(false);

  
  const {
    layoutItems,
    isSaving,
    activeDragItem, // Usamos el del hook
    handleDragStart, // Usamos el del hook
    handleDragEnd,
    handleSave,
    handleTaskChange,
    handleDeleteTask,
    handleSectionChange,
    handleDeleteSection,
  } = useTemplateLayout(template, setIsDirty); // Pasamos el setter al hook

  // CORREGIDO: Se elimina el estado local de 'activeDragItem' para evitar duplicidad.

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  return (
    // CORREGIDO: Pasamos los handlers del hook al DndContext
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4">
        <div className="col-span-3">
          <TaskToolbox />
        </div>
        <div className="col-span-9">
          {/* CORREGIDO: Pasamos todas las props necesarias al Canvas */}
          <DroppableCanvas
            template={template}
            layoutItems={layoutItems}
            isDirty={isDirty}
            isSaving={isSaving}
            activeDragItem={activeDragItem}
            onSave={handleSave}
            onTaskChange={handleTaskChange}
            onDeleteTask={handleDeleteTask}
            onSectionChange={handleSectionChange}
            onDeleteSection={handleDeleteSection}
          />
        </div>
      </div>

      {/* El DragOverlay ahora usa 'activeDragItem' del hook */}
      <DragOverlay>
        {activeDragItem?.type === 'toolbox-item' && <ToolboxDragOverlayItem task={activeDragItem.task} />}
        {activeDragItem?.type === 'canvas-item' && <SortableTaskItem task={activeDragItem.task} isOverlay />}
        {activeDragItem?.type === 'section-item' && <SortableSectionItem section={activeDragItem.section} isOverlay />}
      </DragOverlay>
    </DndContext>
  );
}
