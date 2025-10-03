import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { MaintenanceTemplateTask, TaskOptions } from '@/types/maintenance';
import { Settings, Settings2 } from 'lucide-react';

interface Props {
  task: MaintenanceTemplateTask;
  onOptionChange: (taskId: number, option: keyof TaskOptions, value: any) => void;
  onDescriptionChange: (taskId: number, newDescription: string) => void;
}

// Componente reutilizable para el selector de 3 estados
const RequirementSelector = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: 'disabled' | 'optional' | 'mandatory';
  onChange: (newValue: 'disabled' | 'optional' | 'mandatory') => void;
}) => {
  const options: ('disabled' | 'optional' | 'mandatory')[] = ['disabled', 'optional', 'mandatory'];
  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="mt-1 grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
        {options.map((option) => (
          <Button
            key={option}
            variant={value === option ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onChange(option)}
            className="h-8 text-xs capitalize"
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};

export function TaskSettingsPopover({ task, onOptionChange, onDescriptionChange }: Props) {
  // Los nuevos tipos de contenido no tienen opciones configurables
  const isContentBlock = ['header', 'paragraph', 'bullet_list'].includes(task.task_type);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 border-border/50 bg-background/80 backdrop-blur-sm" align="end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Task Settings</h4>
            <p className="text-sm text-muted-foreground">Configure the behavior of this task.</p>
          </div>
          <div className="grid gap-4">
            {/* --- Campo de Descripción --- */}
            <div>
              <Label htmlFor="description">Help Text / Description</Label>
              <Textarea
                id="description"
                value={task.description || ''}
                onChange={(e) => onDescriptionChange(task.id, e.target.value)}
                placeholder="Provide instructions for the operator..."
                className="mt-1"
              />
            </div>
            {/* --- Opciones (solo para inputs) --- */}
            {!isContentBlock && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_mandatory"
                    checked={task.options?.is_mandatory || false}
                    onCheckedChange={(checked) => onOptionChange(task.id, 'is_mandatory', checked)}
                  />
                  <Label htmlFor="is_mandatory">Task is Mandatory</Label>
                </div>
                <RequirementSelector
                  label="Photo Requirement"
                  value={task.options?.photo_requirement || 'disabled'}
                  onChange={(value) => onOptionChange(task.id, 'photo_requirement', value)}
                />
                <RequirementSelector
                  label="Comment Requirement"
                  value={task.options?.comment_requirement || 'disabled'}
                  onChange={(value) => onOptionChange(task.id, 'comment_requirement', value)}
                />
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
