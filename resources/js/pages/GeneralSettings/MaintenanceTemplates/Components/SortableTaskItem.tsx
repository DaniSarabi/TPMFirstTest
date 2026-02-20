import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { MaintenanceTemplateTask } from '@/types/maintenance';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Camera, GripVertical, List, MessageSquare, PlusCircle, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { TaskSettingsPopover } from '../Components/TaskSettingsPopover';

interface Props {
  // 1. ADD THIS: We must accept the string ID (e.g., "task-1")
  id?: string | number; 
  task: MaintenanceTemplateTask;
  activeDragType: string | null;
  isOverlay?: boolean;
  onLabelChange: (taskId: number, newLabel: string) => void;
  onDelete: (taskId: number) => void;
  onOptionChange: (taskId: number, option: string, value: any) => void;
  onDescriptionChange: (taskId: number, newDescription: string) => void;
}

// ... (Keep EditableLabel, EditableParagraph, BulletedList exactly as they are) ...
// (I am omitting them here to save space, do not delete them!)

const EditableLabel = ({ task, onLabelChange }: { task: MaintenanceTemplateTask; onLabelChange: Props['onLabelChange'] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(task.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (task.label !== label) {
      onLabelChange(task.id, label);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        className="h-8 w-full"
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label className="font-medium" onDoubleClick={() => setIsEditing(true)}>
        {task.label}
      </label>
      {task.options?.is_mandatory && <span className="font-bold text-destructive">*</span>}
      <div className="flex items-center gap-1.5">
        {task.options?.photo_requirement === 'optional' && <Camera className="h-4 w-4 text-muted-foreground" />}
        {task.options?.photo_requirement === 'mandatory' && <Camera className="h-4 w-4 text-destructive" />}
        {task.options?.comment_requirement === 'optional' && <MessageSquare className="h-4 w-4 text-muted-foreground" />}
        {task.options?.comment_requirement === 'mandatory' && <MessageSquare className="h-4 w-4 text-destructive" />}
      </div>
    </div>
  );
};
const EditableParagraph = ({ task, onDescriptionChange }: { task: MaintenanceTemplateTask; onDescriptionChange: Props['onDescriptionChange'] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(task.description || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (isEditing) textareaRef.current?.focus();
  }, [isEditing]);
  const handleSave = () => {
    if (task.description !== text) onDescriptionChange(task.id, text);
    setIsEditing(false);
  };
  if (isEditing) {
    return <Textarea ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)} onBlur={handleSave} />;
  }
  return (
    <p className="rounded-sm border-1 border-primary p-3 text-muted-foreground" onDoubleClick={() => setIsEditing(true)}>
      {task.description || 'Double-click to edit paragraph...'}
    </p>
  );
};

const BulletedList = ({ task, onOptionChange }: { task: MaintenanceTemplateTask; onOptionChange: Props['onOptionChange'] }) => {
  const items = task.options?.list_items || [];

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onOptionChange(task.id, 'list_items', newItems);
  };

  const handleAddItem = () => {
    onOptionChange(task.id, 'list_items', [...items, '']);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onOptionChange(task.id, 'list_items', newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newItems = [...items];
      newItems.splice(index + 1, 0, ''); // Inserta un nuevo item vacío después del actual
      onOptionChange(task.id, 'list_items', newItems);
      // Pequeño delay para que React actualice el DOM antes de hacer focus
      setTimeout(() => {
        const nextInput = document.getElementById(`list-item-${task.id}-${index + 1}`);
        nextInput?.focus();
      }, 50);
    }
    if (e.key === 'Backspace' && items[index] === '') {
      e.preventDefault();
      handleDeleteItem(index);
    }
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="group/item flex items-center gap-2">
          <List className="h-4 w-4 text-muted-foreground" />
          <Input
            id={`list-item-${task.id}-${index}`}
            value={item}
            onChange={(e) => handleItemChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="h-8 flex-1"
            placeholder="List item..."
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground opacity-0 group-hover/item:opacity-100"
            onClick={() => handleDeleteItem(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={handleAddItem} className="mt-1 text-muted-foreground">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Item
      </Button>
    </div>
  );
};

export const SortableTaskItem = React.memo(function SortableTaskItem({
  id, // 2. RECEIVE THIS
  task,
  activeDragType,
  isOverlay,
  onLabelChange,
  onDelete,
  onOptionChange,
  onDescriptionChange,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    // 3. USE IT HERE (If 'id' string exists, use it. Otherwise fallback to number)
    id: id || task.id, 
    // 4. IMPORTANT: Update data to match what the hook expects (dndType)
    data: { dndType: 'task', task }, 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderTaskPreview = () => {
    switch (task.task_type) {
      case 'header':
        return (
          <h2 className="text-xl font-bold">
            <EditableLabel task={task} onLabelChange={onLabelChange} />
          </h2>
        );
      case 'paragraph':
        return <EditableParagraph task={task} onDescriptionChange={onDescriptionChange} />;
      case 'bullet_list':
        return (
          <div>
            <EditableLabel task={task} onLabelChange={onLabelChange} />
            <div className="mt-2">
              <BulletedList task={task} onOptionChange={onOptionChange} />
            </div>
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={`task-${task.id}`} />
            <EditableLabel task={task} onLabelChange={onLabelChange} />
          </div>
        );
      case 'pass_fail':
        return (
          <div>
            <EditableLabel task={task} onLabelChange={onLabelChange} />
            <RadioGroup className="mt-2 flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem className="" value="pass" id={`task-${task.id}-pass`} />
                <Label htmlFor={`task-${task.id}-pass`}>Pass</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem className="" value="fail" id={`task-${task.id}-fail`} />
                <Label htmlFor={`task-${task.id}-fail`}>Fail</Label>
              </div>
            </RadioGroup>
          </div>
        );
      case 'numeric_input':
        return (
          <div>
            <EditableLabel task={task} onLabelChange={onLabelChange} />
            <Input type="number" placeholder="Enter value..." className="mt-2 shadow-lg ring ring-ring drop-shadow-lg" />
          </div>
        );
      case 'text_observation':
        return (
          <div>
            <EditableLabel task={task} onLabelChange={onLabelChange} />
            <Textarea placeholder="Enter observation..." className="mt-2 shadow-lg ring ring-ring drop-shadow-lg" />
          </div>
        );
      default:
        return <div>{task.label}</div>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group flex items-center rounded-lg bg-white p-3 transition-colors hover:bg-muted/50', {
        'opacity-50': isDragging && !isOverlay,
        'pointer-events-none': activeDragType === 'toolbox-item',
      })}
    >
      <div className="flex h-full items-center">
        <Button
          variant="ghost"
          size="sm"
          className="cursor-grab p-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </Button>
      </div>
      <div className="ml-2 flex-grow">{renderTaskPreview()}</div>
      <div className="flex h-full items-center">
        <TaskSettingsPopover task={task} onOptionChange={onOptionChange} onDescriptionChange={onDescriptionChange} />
        <Button
          variant="ghost"
          size="sm"
          className="p-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});