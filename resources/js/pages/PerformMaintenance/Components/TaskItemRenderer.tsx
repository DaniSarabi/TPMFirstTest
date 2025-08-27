import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { MaintenancePhoto, MaintenanceTemplateTask } from '@/types/maintenance';
import { Camera, X } from 'lucide-react';
import React from 'react';

interface Props {
  task: MaintenanceTemplateTask;
  index: number;
  data: any;
  setData: (key: string, value: any) => void;
  errors: any;
  onPhotoClick: () => void;
  onRemovePhoto: (taskIndex: number, photoIndex: number) => void;
  onRemoveExistingPhoto: (photoId: number) => void;
  existingPhotos: MaintenancePhoto[];
}

export function TaskItemRenderer({ task, index, data, setData, errors, onPhotoClick, onRemovePhoto, onRemoveExistingPhoto, existingPhotos }: Props) {
  const resultValue = data.results[index].result;
  const newPhotos = data.results[index].photos as File[];

  const handleResultChange = (value: any) => {
    const newResults = [...data.results];
    newResults[index].result = value;
    setData('results', newResults);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newResults = [...data.results];
    newResults[index].comment = e.target.value;
    setData('results', newResults);
  };

  const renderInput = () => {
    switch (task.task_type) {
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={`task-${task.id}`} checked={resultValue === true} onCheckedChange={(checked) => handleResultChange(Boolean(checked))} />
            <Label htmlFor={`task-${task.id}`}>Mark as completed</Label>
          </div>
        );
      case 'pass_fail':
        return (
          <RadioGroup className="flex space-x-4" value={resultValue} onValueChange={handleResultChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pass" id={`task-${task.id}-pass`} />
              <Label htmlFor={`task-${task.id}-pass`}>Pass</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fail" id={`task-${task.id}-fail`} />
              <Label htmlFor={`task-${task.id}-fail`}>Fail</Label>
            </div>
          </RadioGroup>
        );
      case 'numeric_input':
        return (
          <Input
            className="ring ring-ring"
            type="number"
            placeholder="Enter value..."
            value={resultValue || ''}
            onChange={(e) => handleResultChange(e.target.value)}
          />
        );
      case 'text_observation':
        return (
          <Textarea
            className="ring ring-ring"
            placeholder="Enter observation..."
            value={resultValue || ''}
            onChange={(e) => handleResultChange(e.target.value)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 rounded-md border bg-card p-4 shadow-sm drop-shadow-lg">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-base font-semibold">{task.label}</Label>
            {task.options?.is_mandatory && <span className="text-sm text-destructive">*</span>}
          </div>
          {task.description && <p className="py-0 text-sm text-muted-foreground italic">{task.description}</p>}
        </div>
      </div>

      <div className="pl-2">{renderInput()}</div>

      {task.options?.comment_required && (
        <div className="pl-2">
          <Textarea
            className="ring ring-ring"
            placeholder="Add an optional comment..."
            value={data.results[index].comment}
            onChange={handleCommentChange}
          />
        </div>
      )}

      {task.options?.photo_required && (
        <div className="space-y-2 pl-2">
          <Label>Photos</Label>
          <div className="flex flex-wrap gap-2">
            {/* Display existing photos with a delete button */}
            {existingPhotos.map((photo) => (
              <div key={photo.id} className="relative h-24 w-24">
                <img src={photo.photo_url} alt="Existing maintenance photo" className="h-full w-full rounded-md object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => onRemoveExistingPhoto(photo.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {/* Display newly added photos */}
            {newPhotos.map((file, photoIndex) => (
              <div key={photoIndex} className="relative h-24 w-24">
                <img src={URL.createObjectURL(file)} alt={`New photo ${photoIndex + 1}`} className="h-full w-full rounded-md object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => onRemovePhoto(index, photoIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" className="h-24 w-24" onClick={onPhotoClick}>
              <Camera className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}

      {errors[`results.${index}.result`] && <p className="pl-2 text-sm text-destructive">{errors[`results.${index}.result`]}</p>}
    </div>
  );
}
