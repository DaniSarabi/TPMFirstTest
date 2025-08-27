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
import { Camera, GripVertical, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { TaskSettingsPopover } from './TaskSettingsPopover';

interface Props {
  task: MaintenanceTemplateTask;
  activeDragType: string | null; // New prop to detect what's being dragged
  onLabelChange: (taskId: number, newLabel: string) => void;
  onDelete: (taskId: number) => void;
  onOptionChange: (taskId: number, option: string, value: any) => void;
  onDescriptionChange: (taskId: number, newDescription: string) => void;
}

// A small component to render the editable label
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
      {task.options?.is_mandatory && <span className="text-destructive shrink-0">*</span>}
      {task.options?.photo_required && <Camera className="h-4 w-4 text-destructive shrink-0" />}
    </div>
  );
};

// Main component to render the correct form preview
export function SortableTaskItem({ task, activeDragType, onLabelChange, onDelete, onOptionChange,onDescriptionChange }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'canvas-item', task }, // Add data for the overlay
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderTaskPreview = () => {
    switch (task.task_type) {
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
      className={cn('group flex items-center rounded-lg p-3 transition-colors hover:bg-muted/50', {
        'opacity-50': isDragging, // Make the original item semi-transparent while dragging
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
        <TaskSettingsPopover task={task} onOptionChange={onOptionChange}  onDescriptionChange={onDescriptionChange}/>
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
}
