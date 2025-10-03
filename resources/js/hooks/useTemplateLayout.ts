import { MaintenanceTemplate, MaintenanceTemplateSection, MaintenanceTemplateTask } from '@/types/maintenance';
import { DragEndEvent, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { router } from '@inertiajs/react';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';

// Nuestro tipo de dato unificado para el estado del layout
export type LayoutItem =
  | { dndType: 'section'; id: UniqueIdentifier; data: MaintenanceTemplateSection }
  | { dndType: 'task'; id: UniqueIdentifier; data: MaintenanceTemplateTask };

export function useTemplateLayout(template: MaintenanceTemplate, onDirtyChange: (isDirty: boolean) => void) {
  const [layoutItems, setLayoutItems] = useState<LayoutItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<any | null>(null);

  useEffect(() => {
    const sections = template.sections || [];
    const rootTasks = template.tasks || [];

    // Create layout items with their order
    const sectionItems: LayoutItem[] = sections.map((s) => ({
      dndType: 'section' as const,
      id: s.id,
      data: s,
    }));

    const taskItems: LayoutItem[] = rootTasks.map((t) => ({
      dndType: 'task' as const,
      id: t.id,
      data: t,
    }));

    // Combine and sort by order
    const combined = [...sectionItems, ...taskItems].sort((a, b) => {
      return a.data.order - b.data.order;
    });

    setLayoutItems(combined);
  }, [template]);
  useEffect(() => {
    const initialSections = template.sections || [];
    const initialTasks = template.tasks || [];
    const currentSections = layoutItems.filter((item) => item.dndType === 'section').map((item) => item.data);
    const currentRootTasks = layoutItems.filter((item) => item.dndType === 'task').map((item) => item.data);
    const dirty = !isEqual(initialSections, currentSections) || !isEqual(initialTasks, currentRootTasks);
    onDirtyChange(dirty);
  }, [layoutItems, template, onDirtyChange]);

  const findContainerId = (id: UniqueIdentifier): UniqueIdentifier => {
    if (id === 'root-droppable-area' || layoutItems.some((item) => item.id === id && (item.dndType === 'task' || item.dndType === 'section')))
      return 'root';
    for (const item of layoutItems) {
      if (item.dndType === 'section' && (item.data.tasks.some((t) => t.id === id) || `section-droppable-${item.id}` === id)) {
        return item.id;
      }
    }
    return 'root';
  };

  // --- Handlers para modificar el estado ---
  const handleTaskChange = (taskId: number, updatedProperties: Partial<MaintenanceTemplateTask>) => {
    setLayoutItems((prev) =>
      prev.map((item) => {
        // --- Caso 1: La tarea está dentro de una sección ---
        if (item.dndType === 'section') {
          const taskIndex = item.data.tasks.findIndex((t) => t.id === taskId);
          if (taskIndex === -1) {
            return item; // La tarea no está en esta sección, no hacer nada
          }

          const newTasks = [...item.data.tasks];
          const originalTask = newTasks[taskIndex];

          // THE FIX (for nested tasks): Merge the options object
          newTasks[taskIndex] = {
            ...originalTask,
            ...updatedProperties,
            options: {
              ...originalTask.options,
              ...updatedProperties.options,
            },
          };

          return { ...item, data: { ...item.data, tasks: newTasks } };
        }

        // --- Caso 2: La tarea es un item raíz ---
        if (item.dndType === 'task' && item.id === taskId) {
          // THE FIX (for root tasks): Merge the options object
          const updatedData = {
            ...item.data,
            ...updatedProperties,
            options: {
              ...item.data.options,
              ...updatedProperties.options,
            },
          };
          return { ...item, data: updatedData };
        }

        return item;
      }),
    );
  };

  const handleDeleteTask = (taskId: number) => {
    // Filtra la tarea si es un item raíz
    const newLayout = layoutItems.filter((item) => item.id !== taskId);
    // Filtra la tarea si está dentro de una sección
    setLayoutItems(
      newLayout.map((item) => {
        if (item.dndType === 'section') {
          return { ...item, data: { ...item.data, tasks: item.data.tasks.filter((t) => t.id !== taskId) } };
        }
        return item;
      }),
    );
  };
  const handleSectionChange = (sectionId: number, updatedProperties: Partial<MaintenanceTemplateSection>) => {
    setLayoutItems((prev) =>
      prev.map((item) => (item.dndType === 'section' && item.id === sectionId ? { ...item, data: { ...item.data, ...updatedProperties } } : item)),
    );
  };
  const handleDeleteSection = (sectionId: number) => {
    setLayoutItems((prev) => prev.filter((item) => item.id !== sectionId));
  };

  // --- Lógica de Drag and Drop ---
  const handleDragStart = (event: DragStartEvent) => setActiveDragItem(event.active.data.current);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;

    // 1. Si no hay destino o es el mismo elemento, no hacer nada
    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;

    // ?
    if (activeType === 'toolbox-item') {
      const targetContainerId = findContainerId(over.id);

      // Crear el nuevo item (sección o tarea)
      const newItem = (() => {
        const isSection = active.data.current?.task.id === 'section';
        if (isSection) {
          const newSectionData: MaintenanceTemplateSection = {
            id: -Date.now(),
            maintenance_template_id: template.id,
            title: 'New Section',
            description: '',
            order: 0,
            tasks: [],
          };
          return { dndType: 'section' as const, id: newSectionData.id, data: newSectionData };
        }
        const taskData = active.data.current?.task;
        const newTaskData: MaintenanceTemplateTask = {
          id: -Date.now(),
          maintenance_template_id: template.id,
          order: 0,
          task_type: taskData.id,
          label: taskData.label,
          description: '',
          options: taskData.id === 'bullet_list' ? { list_items: [''] } : {},
          created_at: '',
          updated_at: '',
        };
        return { dndType: 'task' as const, id: newTaskData.id, data: newTaskData };
      })();

      // CAMBIADO: Lógica de inserción que respeta la posición del 'over'
      setLayoutItems((prev) => {
        if (targetContainerId === 'root') {
          const overIndex = prev.findIndex((item) => item.id === over.id);
          // Si se suelta sobre un item, se inserta antes. Si se suelta en el área vacía, al final.
          const newIndex = overIndex !== -1 ? overIndex : prev.length;
          const newLayout = [...prev];
          newLayout.splice(newIndex, 0, newItem);
          return newLayout;
        } else {
          // Lógica para insertar dentro de una sección
          return prev.map((item) => {
            if (item.id === targetContainerId && item.dndType === 'section') {
              const overTaskIndex = item.data.tasks.findIndex((t) => t.id === over.id);
              const newIndex = overTaskIndex !== -1 ? overTaskIndex : item.data.tasks.length;
              const newTasks = [...item.data.tasks];
              // Asegurarnos de que solo se puedan dropear tasks en una seccion
              if (newItem.dndType === 'task') {
                newTasks.splice(newIndex, 0, newItem.data);
              }
              return { ...item, data: { ...item.data, tasks: newTasks } };
            }
            return item;
          });
        }
      });
      return;
    }
    // ?

 
    // --- Lógica para mover y reordenar items existentes en el Canvas ---

    // 2. Determinar los contenedores de origen y destino
    const sourceContainerId = findContainerId(active.id);
    const targetContainerId = findContainerId(over.id);

    const activeId = active.id;
    const overId = over.id;

    // 3. Caso: Mover dentro del MISMO contenedor
    if (sourceContainerId === targetContainerId) {
      setLayoutItems((prev) => {
        // Reordenando en el contenedor 'root'
        if (sourceContainerId === 'root') {
          const oldIndex = prev.findIndex((item) => item.id === activeId);
          const newIndex = prev.findIndex((item) => item.id === overId);
          return arrayMove(prev, oldIndex, newIndex);
        }

        // Reordenando dentro de una sección
        const sectionIndex = prev.findIndex((item) => item.id === sourceContainerId);
        if (sectionIndex === -1 || prev[sectionIndex].dndType !== 'section') return prev;

        const newLayout = [...prev];
        const section = newLayout[sectionIndex] as Extract<LayoutItem, { dndType: 'section' }>;
        const oldTaskIndex = section.data.tasks.findIndex((t) => t.id === activeId);
        const newTaskIndex = section.data.tasks.findIndex((t) => t.id === overId);

        section.data.tasks = arrayMove(section.data.tasks, oldTaskIndex, newTaskIndex);
        return newLayout;
      });
      return;
    }

    // 4. Caso: Mover entre DIFERENTES contenedores
    let draggedTask: MaintenanceTemplateTask | undefined;

    // Primero, removemos la tarea de su contenedor de origen
    const layoutAfterRemoval = layoutItems
      .map((item) => {
        // Quitar de una sección de origen
        if (item.id === sourceContainerId && item.dndType === 'section') {
          draggedTask = item.data.tasks.find((t) => t.id === activeId);
          return {
            ...item,
            data: { ...item.data, tasks: item.data.tasks.filter((t) => t.id !== activeId) },
          };
        }
        return item;
      })
      .filter((item) => {
        // Quitar del 'root' de origen
        if (sourceContainerId === 'root' && item.id === activeId) {
          draggedTask = item.data as MaintenanceTemplateTask;
          return false; // Filtrar para eliminarlo
        }
        return true;
      });

    if (!draggedTask) return; // Si no se encontró la tarea, algo salió mal

    // Ahora, insertamos la tarea en su contenedor de destino
    setLayoutItems(() => {
      const finalLayout = layoutAfterRemoval.map((item) => {
        // Insertar en una sección de destino
        if (item.id === targetContainerId && item.dndType === 'section') {
          const overTaskIndex = item.data.tasks.findIndex((t) => t.id === overId);

          // Si 'over' es una tarea, inserta antes de ella. Si no, al final.
          const newIndex = overTaskIndex >= 0 ? overTaskIndex : item.data.tasks.length;
          const newTasks = [...item.data.tasks];
          newTasks.splice(newIndex, 0, draggedTask!);

          return { ...item, data: { ...item.data, tasks: newTasks } };
        }
        return item;
      });

      // Insertar en el 'root' de destino
      if (targetContainerId === 'root') {
        const overIndex = finalLayout.findIndex((item) => item.id === overId);

        // Si 'over' es un item del root, inserta antes. Si no, al final.
        const newIndex = overIndex >= 0 ? overIndex : finalLayout.length;
        finalLayout.splice(newIndex, 0, { dndType: 'task', id: draggedTask.id, data: draggedTask });
      }

      return finalLayout;
    });
  };

  const handleSave = () => {
    console.log('Layout items before save:', layoutItems);

    setIsSaving(true);

    // Calculate order for ALL items first (sections + root tasks together)
    const itemsWithOrder = layoutItems.map((item, globalIndex) => ({
      ...item,
      globalOrder: globalIndex, // This is the unified order!
    }));

    // Now separate them while keeping the correct global order
    const root_tasks = itemsWithOrder
      .filter((item) => item.dndType === 'task')
      .map((item) => ({
        ...item.data,
        order: item.globalOrder, // Use the global order, not the filtered index
        options: JSON.stringify(item.data.options),
      }));

    const sections = itemsWithOrder
      .filter((item) => item.dndType === 'section')
      .map((item) => {
        console.log('Section being saved:', item.data);
        console.log('Tasks in this section:', item.data.tasks);
        return {
          ...(item.data as MaintenanceTemplateSection),
          order: item.globalOrder,
          tasks: (item.data as MaintenanceTemplateSection).tasks.map((task, taskIndex) => ({
            ...task,
            order: taskIndex,
            options: JSON.stringify(task.options),
          })),
        };
      });

    console.log('Sections to send:', sections);

    router.put(
      route('settings.maintenance-templates.sync-layout', template.id),
      { root_tasks, sections },
      {
        preserveScroll: true,
        onSuccess: () => onDirtyChange(false),
        onFinish: () => setIsSaving(false),
      },
    );
  };

  return {
    layoutItems,
    isSaving,
    activeDragItem,
    handleDragStart,
    handleDragEnd,
    handleSave,
    handleTaskChange,
    handleDeleteTask,
    handleSectionChange,
    handleDeleteSection,
  };
}
