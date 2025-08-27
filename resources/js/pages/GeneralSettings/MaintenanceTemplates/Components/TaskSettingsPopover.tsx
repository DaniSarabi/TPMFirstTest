import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { MaintenanceTemplateTask } from '@/types/maintenance';
import { Settings2 } from 'lucide-react';

interface Props {
  task: MaintenanceTemplateTask;
  onOptionChange: (taskId: number, option: string, value: any) => void;
  onDescriptionChange: (taskId: number, newDescription: string) => void;
}

export function TaskSettingsPopover({ task, onOptionChange, onDescriptionChange }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 border border-primary">
        <div className="grid gap-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="photo-required" className="flex flex-col space-y-1">
              <span>Photo Required*</span>
            </Label>
            <Switch
              id="photo-required"
              checked={!!task.options?.photo_required}
              onCheckedChange={(checked) => onOptionChange(task.id, 'photo_required', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="is_mandatory" className="flex flex-col space-y-1">
              <span>Mandatory*</span>
            </Label>
            <Switch
              id="is_mandatory"
              checked={!!task.options?.is_mandatory}
              onCheckedChange={(checked) => onOptionChange(task.id, 'is_mandatory', checked)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="comment-required" className="flex flex-col space-y-1">
              <span>Show Comment Field*</span>
            </Label>
            <Switch
              id="comment-required"
              checked={!!task.options?.comment_required}
              onCheckedChange={(checked) => onOptionChange(task.id, 'comment_required', checked)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Instructions</Label>
            <Textarea
              id="task-description"
              placeholder="Add optional instructions for the technician..."
              value={task.description || ''}
              onChange={(e) => onDescriptionChange(task.id, e.target.value)}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
