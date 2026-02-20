import { MaintenanceTemplate, MaintenanceTemplateSection, MaintenanceTemplateTask } from '@/types/maintenance';
import { DragEndEvent, DragOverEvent, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { router } from '@inertiajs/react';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';

// Unified type with 'dndId' to prevent React key collisions between Tasks and Sections
export type LayoutItem =
  | { dndType: 'section'; id: UniqueIdentifier; data: MaintenanceTemplateSection }
  | { dndType: 'task'; id: UniqueIdentifier; data: MaintenanceTemplateTask };

export function useTemplateLayout(template: MaintenanceTemplate, onDirtyChange: (isDirty: boolean) => void) {
  const [layoutItems, setLayoutItems] = useState<LayoutItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<any | null>(null);

  // --- BEST PRACTICE: Helper to generate namespaced IDs ---
  // This prevents the "Encountered two children with the same key" error
  const getDndId = (type: 'section' | 'task', id: number) => `${type}-${id}`;

  // --- Initialization ---
  useEffect(() => {
    const sections = template.sections || [];
    const rootTasks = template.tasks || [];

    const sectionItems: LayoutItem[] = sections.map((s) => ({
      dndType: 'section' as const,
      id: getDndId('section', s.id),
      data: s,
    }));

    const taskItems: LayoutItem[] = rootTasks.map((t) => ({
      dndType: 'task' as const,
      id: getDndId('task', t.id),
      data: t,
    }));

    // Combine and sort by 'order'
    const combined = [...sectionItems, ...taskItems].sort((a, b) => {
      return a.data.order - b.data.order;
    });

    setLayoutItems(combined);
  }, [template]);

  // --- Dirty Check ---
  useEffect(() => {
    const initialSections = template.sections || [];
    const initialTasks = template.tasks || [];
    const currentSections = layoutItems.filter((item) => item.dndType === 'section').map((item) => item.data);
    const currentRootTasks = layoutItems.filter((item) => item.dndType === 'task').map((item) => item.data);

    // Deep comparison using lodash
    const dirty = !isEqual(initialSections, currentSections) || !isEqual(initialTasks, currentRootTasks);
    onDirtyChange(dirty);
  }, [layoutItems, template, onDirtyChange]);

  // --- Helpers ---
  const findContainerId = (id: UniqueIdentifier): UniqueIdentifier | undefined => {
    // Check if item is in root
    if (layoutItems.find((item) => item.id === id)) {
      return 'root';
    }
    // Check if item is inside a section
    // Note: We construct the ID to match what we passed to the SortableTaskItem inside sections
    for (const item of layoutItems) {
      if (item.dndType === 'section') {
        // We look for the Task's numeric ID inside the section,
        // but match it against the dndId format "task-{id}"
        if (item.data.tasks.find((t) => getDndId('task', t.id) === id)) {
          return item.id;
        }
      }
    }
    return undefined;
  };

  // --- CRUD Handlers ---

  const handleMoveSection = (sectionId: number, direction: 'up' | 'down') => {
    setLayoutItems((prev) => {
      const index = prev.findIndex((item) => item.dndType === 'section' && item.data.id === sectionId);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;

      // Bounds check
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      return arrayMove(prev, index, newIndex);
    });
  };

  const handleTaskChange = (taskId: number, updatedProperties: Partial<MaintenanceTemplateTask>) => {
    setLayoutItems((prev) =>
      prev.map((item) => {
        // Case 1: Task inside a Section
        if (item.dndType === 'section') {
          const taskIndex = item.data.tasks.findIndex((t) => t.id === taskId);
          if (taskIndex === -1) return item;

          const newTasks = [...item.data.tasks];
          newTasks[taskIndex] = {
            ...newTasks[taskIndex],
            ...updatedProperties,
            options: { ...newTasks[taskIndex].options, ...updatedProperties.options },
          };
          return { ...item, data: { ...item.data, tasks: newTasks } };
        }
        // Case 2: Root Task
        if (item.dndType === 'task' && item.data.id === taskId) {
          return {
            ...item,
            data: {
              ...item.data,
              ...updatedProperties,
              options: { ...item.data.options, ...updatedProperties.options },
            },
          };
        }
        return item;
      }),
    );
  };

  const handleDeleteTask = (taskId: number) => {
    // Filter root tasks
    const newLayout = layoutItems.filter((item) => !(item.dndType === 'task' && item.data.id === taskId));

    // Filter tasks inside sections
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
      prev.map((item) =>
        item.dndType === 'section' && item.data.id === sectionId ? { ...item, data: { ...item.data, ...updatedProperties } } : item,
      ),
    );
  };

  const handleDeleteSection = (sectionId: number) => {
    setLayoutItems((prev) => prev.filter((item) => !(item.dndType === 'section' && item.data.id === sectionId)));
  };

  // --- DRAG AND DROP LOGIC ---

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragItem(event.active.data.current);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // RULE: Sections are static (moved via arrows), so we assume only Tasks are being dragged here.
    // If active item is a section, we simply ignore it during drag over.
    if (active.data.current?.dndType === 'section') return;

    const activeId = active.id;
    const overId = over.id;

    // Find source and target containers
    const activeContainer = findContainerId(activeId);

    // Determine target container:
    // 1. Is it a Section container itself? (Dropped ON the section header)
    // 2. Is it an item INSIDE a container?
    const overItem = layoutItems.find((i) => i.id === overId);
    const overContainer = overItem && overItem.dndType === 'section' ? overItem.id : findContainerId(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Moving Logic: Root <-> Section OR Section <-> Section
    setLayoutItems((prev) => {
      // Get source items
      const activeItems = activeContainer === 'root' ? prev : (prev.find((i) => i.id === activeContainer) as any)?.data.tasks || [];

      // Get target items
      const overItems = overContainer === 'root' ? prev : (prev.find((i) => i.id === overContainer) as any)?.data.tasks || [];

      // Find indexes
      // Note: We match by the string ID (dndId) which we construct on the fly for tasks inside sections
      const activeIndex = activeItems.findIndex((i: any) => {
        // If in root, 'i' is LayoutItem. If in section, 'i' is Task.
        const idToCheck = i.dndType === 'task' ? i.id : getDndId('task', i.id);
        return idToCheck === activeId;
      });

      const overIndex = overItems.findIndex((i: any) => {
        const idToCheck = i.dndType === 'task' ? i.id : getDndId('task', i.id);
        return idToCheck === overId;
      });

      let newIndex;
      if (overId in prev) {
        // We are hovering over the container itself (empty section case)
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      let newLayout = [...prev];
      let draggedItemData: any;

      // 1. Remove from Source
      if (activeContainer === 'root') {
        const itemIndex = newLayout.findIndex((i) => i.id === activeId);
        draggedItemData = newLayout[itemIndex].data;
        newLayout.splice(itemIndex, 1);
      } else {
        const sectionIndex = newLayout.findIndex((i) => i.id === activeContainer);
        const section = { ...newLayout[sectionIndex] } as any;
        const taskIndex = section.data.tasks.findIndex((t: any) => getDndId('task', t.id) === activeId);
        draggedItemData = section.data.tasks[taskIndex];

        const newTasks = [...section.data.tasks];
        newTasks.splice(taskIndex, 1);
        newLayout[sectionIndex] = { ...section, data: { ...section.data, tasks: newTasks } };
      }

      // 2. Add to Target
      if (overContainer === 'root') {
        const newItem: LayoutItem = { dndType: 'task', id: getDndId('task', draggedItemData.id), data: draggedItemData };
        // If dropping into root, we need to map the index to the Root array size
        const rootInsertIndex = newIndex >= newLayout.length ? newLayout.length : newIndex;
        newLayout.splice(rootInsertIndex, 0, newItem);
      } else {
        const sectionIndex = newLayout.findIndex((i) => i.id === overContainer);
        const section = { ...newLayout[sectionIndex] } as any;
        const newTasks = [...section.data.tasks];
        // Ensure index is valid for the target task array
        const taskInsertIndex = newIndex >= newTasks.length ? newTasks.length : newIndex;
        newTasks.splice(taskInsertIndex, 0, draggedItemData);
        newLayout[sectionIndex] = { ...section, data: { ...section.data, tasks: newTasks } };
      }

      return newLayout;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    // --- CASE 1: Dropping from Toolbox ---
    if (active.data.current?.type === 'toolbox-item') {
      const toolData = active.data.current.task;
      const isNewSection = toolData.id === 'section';

      // If creating a SECTION, we simply append it to the end (simplest UX)
      // or insert it at the root index if dropped over a root item.
      if (isNewSection) {
        createNewSection(over ? over.id : undefined);
        return;
      }

      // If creating a TASK
      if (!over) return;
      const targetContainerId = findContainerId(over.id) || 'root';
      createNewTask(toolData, targetContainerId, over.id);
      return;
    }

    // --- CASE 2: Reordering (Sorting) ---
    if (over && active.id !== over.id) {
      const activeContainer = findContainerId(active.id);
      const overContainer = findContainerId(over.id);

      // We only handle sorting within the SAME container here.
      // Moving between containers is handled by handleDragOver.
      if (activeContainer && activeContainer === overContainer) {
        setLayoutItems((prev) => {
          if (activeContainer === 'root') {
            const oldIndex = prev.findIndex((item) => item.id === active.id);
            const newIndex = prev.findIndex((item) => item.id === over.id);
            return arrayMove(prev, oldIndex, newIndex);
          } else {
            const sectionIndex = prev.findIndex((i) => i.id === activeContainer);
            const section = { ...prev[sectionIndex] } as any;

            const oldIndex = section.data.tasks.findIndex((t: any) => getDndId('task', t.id) === active.id);
            const newIndex = section.data.tasks.findIndex((t: any) => getDndId('task', t.id) === over.id);

            const newTasks = arrayMove(section.data.tasks, oldIndex, newIndex);

            const newLayout = [...prev];
            newLayout[sectionIndex] = { ...section, data: { ...section.data, tasks: newTasks } };
            return newLayout;
          }
        });
      }
    }
  };

  // --- Creation Helpers ---

  const createNewSection = (overId?: UniqueIdentifier) => {
    const newId = -Date.now();
    const newSection: LayoutItem = {
      dndType: 'section',
      id: getDndId('section', newId),
      data: { id: newId, maintenance_template_id: template.id, title: 'New Section', description: '', order: 0, tasks: [] },
    };

    setLayoutItems((prev) => {
      const newLayout = [...prev];
      // Try to find insertion point, otherwise append
      const overIndex = overId ? prev.findIndex((i) => i.id === overId) : -1;
      const insertIndex = overIndex >= 0 ? overIndex : prev.length;
      newLayout.splice(insertIndex, 0, newSection);
      return newLayout;
    });
  };

  const createNewTask = (toolData: any, containerId: UniqueIdentifier, overId: UniqueIdentifier) => {
    const newItemId = -Date.now();
    const newTaskData: MaintenanceTemplateTask = {
      id: newItemId,
      maintenance_template_id: template.id,
      order: 0,
      task_type: toolData.id,
      label: toolData.label,
      description: '',
      options: toolData.id === 'bullet_list' ? { list_items: [''] } : {},
      created_at: '',
      updated_at: '',
    };

    setLayoutItems((prev) => {
      const newLayout = [...prev];

      if (containerId === 'root') {
        const newItem: LayoutItem = { dndType: 'task', id: getDndId('task', newItemId), data: newTaskData };
        const overIndex = prev.findIndex((i) => i.id === overId);
        const insertIndex = overIndex >= 0 ? overIndex : prev.length;
        newLayout.splice(insertIndex, 0, newItem);
      } else {
        const sectionIndex = newLayout.findIndex((i) => i.id === containerId);
        const section = newLayout[sectionIndex] as any;

        const overTaskIndex = section.data.tasks.findIndex((t: any) => getDndId('task', t.id) === overId);
        const insertIndex = overTaskIndex >= 0 ? overTaskIndex : section.data.tasks.length;

        const newTasks = [...section.data.tasks];
        newTasks.splice(insertIndex, 0, newTaskData);
        newLayout[sectionIndex] = { ...section, data: { ...section.data, tasks: newTasks } };
      }
      return newLayout;
    });
  };

  // --- SAVE ---
  const handleSave = () => {
    setIsSaving(true);

    // Assign Global Order based on the flat list index
    const itemsWithOrder = layoutItems.map((item, globalIndex) => ({
      ...item,
      globalOrder: globalIndex,
    }));

    // Extract Root Tasks
    const root_tasks = itemsWithOrder
      .filter((item) => item.dndType === 'task')
      .map((item) => ({
        ...item.data,
        order: item.globalOrder,
        options: JSON.stringify(item.data.options),
      }));

    // Extract Sections and their inner tasks
    const sections = itemsWithOrder
      .filter((item) => item.dndType === 'section')
      .map((item) => ({
        ...(item.data as any),
        order: item.globalOrder,
        tasks: (item.data as any).tasks.map((task: any, i: number) => ({
          ...task,
          order: i, // Order is strictly 0,1,2... within the section
          options: JSON.stringify(task.options),
        })),
      }));

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
    handleDragOver,
    handleDragEnd,
    handleMoveSection,
    handleSave,
    handleTaskChange,
    handleDeleteTask,
    handleSectionChange,
    handleDeleteSection,
  };
}
