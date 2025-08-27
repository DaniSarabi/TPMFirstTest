import { MaintenanceTemplate, MaintenanceTemplateTask } from '@/types/maintenance';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { router } from '@inertiajs/react';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';
import { DroppableCanvas } from './DroppableCanvas';
import { SortableTaskItem } from './SortableTaskItem';
import { TaskToolbox } from './TaskToolbox';
import { ToolboxDragOverlayItem } from './ToolboxDragOverlayItem';

interface Props {
  template: MaintenanceTemplate;
  onDirtyChange: (isDirty: boolean) => void;
}

export function TemplateBuilder({ template, onDirtyChange }: Props) {
  const [tasks, setTasks] = useState<MaintenanceTemplateTask[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDragData, setActiveDragData] = useState<any | null>(null);

  useEffect(() => {
    setTasks(JSON.parse(JSON.stringify(template.tasks)));
  }, [template]);

  // This effect now reports changes up to the parent component
  useEffect(() => {
    const dirty = !isEqual(template.tasks, tasks);
    onDirtyChange(dirty);
  }, [tasks, template.tasks, onDirtyChange]);

  const handleLabelChange = (taskId: number, newLabel: string) => {
    setTasks((currentTasks) => currentTasks.map((task) => (task.id === taskId ? { ...task, label: newLabel } : task)));
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  };

  const handleOptionsChange = (taskId: number, option: string, value: any) => {
    setTasks((currentTasks) => currentTasks.map((task) => (task.id === taskId ? { ...task, options: { ...task.options, [option]: value } } : task)));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragData(event.active.data.current);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragData(null);
    const { over, active } = event;

    if (!over) return;

    if (active.data.current?.type === 'canvas-item' && over.data.current?.type === 'canvas-item' && active.id !== over.id) {
      setTasks((currentTasks) => {
        const oldIndex = currentTasks.findIndex((task) => task.id === active.id);
        const newIndex = currentTasks.findIndex((task) => task.id === over.id);
        return arrayMove(currentTasks, oldIndex, newIndex);
      });
      return;
    }

    if (active.data.current?.type === 'toolbox-item') {
      const taskData = active.data.current?.task;
      const newTask: MaintenanceTemplateTask = {
        id: -Math.floor(Math.random() * 10000),
        maintenance_template_id: template.id,
        order: 0,
        task_type: taskData.id,
        label: `${taskData.label} Label`,
        description: '',
        options: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (over.id === 'canvas-droppable-area') {
        setTasks((currentTasks) => [...currentTasks, newTask]);
        return;
      }

      if (over.data.current?.type === 'canvas-item') {
        const overIndex = tasks.findIndex((task) => task.id === over.id);
        setTasks((currentTasks) => {
          const newTasks = [...currentTasks];
          newTasks.splice(overIndex, 0, newTask);
          return newTasks;
        });
      }
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    const tasksToSave = tasks.map((task, index) => ({ ...task, order: index }));

    router.put(route('settings.maintenance-templates.sync-tasks', template.id), { tasks: tasksToSave } as any, {
      preserveScroll: true,
      onSuccess: () => onDirtyChange(false),
      onFinish: () => setIsSaving(false),
    });
  };

  const handleDescriptionChange = (taskId: number, newDescription: string) => {
    setTasks((currentTasks) => currentTasks.map((task) => (task.id === taskId ? { ...task, description: newDescription } : task)));
  };
  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="space-y-4">
        <TaskToolbox />

        <DroppableCanvas
          template={template}
          tasks={tasks}
          isDirty={!isEqual(template.tasks, tasks)}
          isSaving={isSaving}
          activeDragType={activeDragData?.type || null}
          onSave={handleSave}
          onLabelChange={handleLabelChange}
          onDelete={handleDeleteTask}
          onOptionChange={handleOptionsChange}
          onDescriptionChange={handleDescriptionChange}
        />
      </div>
      <DragOverlay>
        {activeDragData?.type === 'canvas-item' && (
          <SortableTaskItem task={activeDragData.task} activeDragType={null} onLabelChange={() => {}} onDelete={() => {}} onOptionChange={() => {}} onDescriptionChange={() => {}} />
        )}
        {activeDragData?.type === 'toolbox-item' && <ToolboxDragOverlayItem task={activeDragData.task} />}
      </DragOverlay>
    </DndContext>
  );
}
