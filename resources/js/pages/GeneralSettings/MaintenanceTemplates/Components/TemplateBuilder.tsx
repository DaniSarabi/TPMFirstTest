import { MaintenanceTemplate } from '@/types/maintenance';
import { 
  DndContext, 
  DragOverlay, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  closestCorners 
} from '@dnd-kit/core';
import { useState } from 'react';

// Import our custom hook and components
import { useTemplateLayout } from '@/hooks/useTemplateLayout';
import { DroppableCanvas } from './DroppableCanvas';
import { SortableTaskItem } from './SortableTaskItem';
import { TaskToolbox } from './TaskToolbox';
import { ToolboxDragOverlayItem } from './ToolboxDragOverlayItem';

interface Props {
  template: MaintenanceTemplate;
}

export function TemplateBuilder({ template }: Props) {
  const [isDirty, setIsDirty] = useState(false);
  
  const {
    layoutItems,
    isSaving,
    activeDragItem, 
    handleDragStart, 
    handleDragOver,
    handleDragEnd,
    handleSave,
    handleTaskChange,
    handleDeleteTask,
    handleSectionChange,
    handleDeleteSection,
    handleMoveSection, // IMPORT THIS
  } = useTemplateLayout(template, setIsDirty); 

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners}
      onDragStart={handleDragStart} 
      onDragOver={handleDragOver} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4">
        <div className="col-span-3">
          <TaskToolbox />
        </div>
        <div className="col-span-9">
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
            onMoveSection={handleMoveSection} // PASS THIS
          />
        </div>
      </div>

      <DragOverlay>
        {/* Toolbox Item Preview */}
        {activeDragItem?.type === 'toolbox-item' && (
            <ToolboxDragOverlayItem task={activeDragItem.task} />
        )}

        {/* Canvas Task Preview */}
        {activeDragItem?.type === 'canvas-item' && (
            <SortableTaskItem 
                // We pass the ID and Data
                id={activeDragItem.task.id}
                task={activeDragItem.task}
                activeDragType={activeDragItem.type ?? null} // Fix undefined error
                isOverlay
                
                // PASS DUMMY HANDLERS:
                // These are required by the component props, but 
                // since this is just a visual ghost, they don't need to do anything.
                onLabelChange={() => {}}
                onDescriptionChange={() => {}}
                onOptionChange={() => {}}
                onDelete={() => {}}
            />
        )}

        {/* Note: We REMOVED the Section Overlay because sections are no longer draggable */}
      </DragOverlay>
    </DndContext>
  );
}
