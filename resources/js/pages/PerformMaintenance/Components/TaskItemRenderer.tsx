import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { MaintenancePhoto, MaintenanceTemplateTask } from '@/types/maintenance';
import { Camera, Upload, X } from 'lucide-react';
import React from 'react';

interface Props {
  task: MaintenanceTemplateTask;
  index: number;
  data: any;
  setData: (key: string, value: any) => void;
  errors: any;
  onTakePhoto: () => void;
  onUploadPhoto: () => void;
  onRemovePhoto: (taskIndex: number, photoIndex: number) => void;
  onRemoveExistingPhoto: (photoId: number) => void;
  existingPhotos: MaintenancePhoto[];
}

export function TaskItemRenderer({
  task,
  index,
  data,
  setData,
  errors,
  onTakePhoto,
  onUploadPhoto,
  onRemovePhoto,
  onRemoveExistingPhoto,
  existingPhotos,
}: Props) {
  const resultForTask = data.results[index] || {};
  const resultValue = resultForTask.result;
  const newPhotos = (resultForTask.photos as File[]) || [];

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

  // ACTION: Se determina si la tarea es un bloque de contenido o una tarea interactiva.
  const isContentBlock = ['header', 'paragraph', 'bullet_list'].includes(task.task_type);

  // --- RENDERIZADO PARA BLOQUES DE CONTENIDO (SIN TARJETA) ---
  if (isContentBlock) {
    switch (task.task_type) {
      case 'header':
        return <h2 className="pt-6 pb-2 text-2xl font-bold text-primary">{task.label}</h2>;
      case 'paragraph':
        return <p className="pb-4 text-muted-foreground">{task.description}</p>;
      case 'bullet_list':
        return (
          <div className="py-4">
            <Label className="text-base font-semibold">{task.label}</Label>
            {task.description && <p className="py-0 text-sm text-muted-foreground italic">{task.description}</p>}
            <ul className="list-disc space-y-1 pt-2 pl-5 text-muted-foreground">
              {task.options?.list_items?.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        );
      default:
        return null;
    }
  }

  // --- RENDERIZADO PARA TAREAS INTERACTIVAS (CON TARJETA) ---
  const showPhotoUploader = task.options?.photo_requirement && task.options.photo_requirement !== 'disabled';
  const showCommentBox = task.options?.comment_requirement && task.options.comment_requirement !== 'disabled';

  const renderInteractiveInput = () => {
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
              <Label>Pass</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fail" id={`task-${task.id}-fail`} />
              <Label>Fail</Label>
            </div>
          </RadioGroup>
        );
      case 'numeric_input':
        return (
          <Input
            className="border-primary"
            type="number"
            placeholder="Enter value..."
            value={resultValue || ''}
            onChange={(e) => handleResultChange(e.target.value)}
          />
        );
      case 'text_observation':
        return (
          <Textarea
            className="border-primary"
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
    <div className="space-y-4 rounded-md border-0 bg-card p-4 shadow-sm drop-shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-base font-semibold">{task.label}</Label>
            {task.options?.is_mandatory && <span className="text-sm text-destructive">*</span>}
          </div>
          {task.description && <p className="py-0 text-sm text-muted-foreground italic">{task.description}</p>}
        </div>
      </div>

      <div className="pl-2">{renderInteractiveInput()}</div>

      {showCommentBox && (
        <div className="space-y-1 pl-2">
          <Label>
            Comment
            {task.options.comment_requirement === 'mandatory' && <span className="text-sm text-destructive"> *</span>}
          </Label>
          <Textarea
            className="border-primary"
            placeholder={task.options.comment_requirement === 'optional' ? 'Add an optional comment...' : 'A comment is required...'}
            value={resultForTask.comment || ''}
            onChange={handleCommentChange}
          />
        </div>
      )}

      {showPhotoUploader && (
        <div className="space-y-2 pl-2">
          <Label>
            Photos
            {task.options.photo_requirement === 'mandatory' && <span className="text-sm text-destructive"> *</span>}
          </Label>
          <div className="flex flex-wrap gap-2">
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
            <Button type="button" variant="outline" className="h-24 w-24" onClick={onTakePhoto}>
              <Camera className="h-6 w-6" />
            </Button>
             <Button type="button" variant="outline" className="h-24 w-24 flex-col gap-1" onClick={onUploadPhoto}>
              <Upload className="h-6 w-6" />
              <span>Upload</span>
            </Button>
          </div>
        </div>
      )}

      {errors[`results.${index}.result`] && <p className="pl-2 text-sm text-destructive">{errors[`results.${index}.result`]}</p>}
    </div>
  );
}
