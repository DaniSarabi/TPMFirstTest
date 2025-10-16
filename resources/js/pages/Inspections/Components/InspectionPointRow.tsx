import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { InspectionPoint } from '@/types/machine';
import { InspectionStatus } from '@/types/settings';
import { Camera, Circle, CircleAlert, CircleCheck, CircleX, Upload } from 'lucide-react';
import * as React from 'react';

// Define the shape of the result data for a single point
export type InspectionResult = {
  status_id?: number;
  comment?: string;
  image?: File | null;
  pinged_ticket_id?: number | null;
  original_image_url?: string | null;
};

interface InspectionPointRowProps {
  point: InspectionPoint;
  statuses: InspectionStatus[];
  result: InspectionResult;
  errors: any;
  onResultChange: (newResult: InspectionResult) => void;
  onStatusChange: (pointId: number, statusId: number) => void; // Add this prop
  onTakePhoto: () => void; // Add a handler for opening the camera
}

// Component for the dynamic status icon
const StatusIcon = ({ status }: { status: InspectionStatus | undefined }) => {
  if (!status) return <Circle className="h-7 w-7 text-muted-foreground" />;
  switch (status.severity) {
    case 0:
      return <CircleCheck className="h-7 w-7 text-green-500" />;
    case 1:
      return <CircleAlert className="h-7 w-7 text-yellow-500" />;
    case 2:
      return <CircleX className="h-7 w-7 text-red-500" />;
    default:
      return <Circle className="h-7 w-7 text-muted-foreground" />;
  }
};

export function InspectionPointRow({ point, statuses, result, errors, onResultChange, onStatusChange, onTakePhoto }: InspectionPointRowProps) {
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const selectedStatus = statuses.find((s) => s.id === result.status_id);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false); // Estado para controlar el popover
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isPing = !!result.pinged_ticket_id;

  const isPhotoRequired = !result.pinged_ticket_id;
  const isCommentRequired = selectedStatus && selectedStatus.severity > 0;

  // Update the preview when the result.image changes
  React.useEffect(() => {
    if (result.image) {
      const url = URL.createObjectURL(result.image);
      setImagePreview(url);
      // Clean up the object URL when the component unmounts or the image changes
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview(null);
    }
  }, [result.image]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onResultChange({ ...result, comment: e.target.value });
  };
  const handleSelectStatus = (statusId: number) => {
    onStatusChange(point.id, statusId);
    setIsPopoverOpen(false); // Cierra el popover después de la selección
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onResultChange({ ...result, image: e.target.files[0] });
    }
  };
  return (
    <div className="mb-4 flex cursor-pointer flex-col rounded-md bg-muted/30 p-2 shadow-lg shadow-primary drop-shadow-lg transition-colors hover:bg-muted/60">
      {/* Main Row: Point Name and Status Selector */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger className="" asChild>
          <div className="flex items-center justify-between rounded-md p-2">
            <div className="flex items-center gap-4">
              <StatusIcon status={selectedStatus} />
              <div>
                <p className="font-medium">{point.name}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground/60 italic">{point.description || 'Sin descripción.'}</p>
              </div>
            </div>

            {selectedStatus && (
              <div
                className="text-md flex items-center gap-2 rounded-full px-4 py-1"
                style={{ backgroundColor: selectedStatus.bg_color, color: selectedStatus.text_color }}
              >
                {selectedStatus.name}
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 border-0 p-2">
          <div className="space-y-1">
            <p className="p-2 text-sm font-semibold">Seleccionar un estado</p>
            {statuses.map((status) => (
              <button
                key={status.id}
                onClick={() => handleSelectStatus(status.id)}
                className="flex w-full items-center rounded-md p-2 text-left text-sm transition-colors hover:cursor-pointer hover:bg-accent"
              >
                <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: status.bg_color }} />
                <span>{status.name}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Inline Details Section (conditionally shown) */}
      {selectedStatus && (
        <div className="mt-4 grid grid-cols-1 gap-4 pl-7 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`comment-${point.id}`}>
              Comment <span className={isCommentRequired ? 'text-red-500' : 'text-blue-500'}>{isCommentRequired ? '(Required)' : '(Optional)'}</span>
            </Label>{' '}
            <Textarea
              id={`comment-${point.id}`}
              value={result.comment || ''}
              onChange={handleCommentChange}
              placeholder="Describe the situation or issue..."
              required={isCommentRequired}
              className="bg-background ring-1 hover:bg-background"
            />
            <InputError message={errors?.[`results.${point.id}.comment`]} />
          </div>
          <div className="space-y-2">
            <Label>
              Foto <span className={isPhotoRequired ? 'text-destructive' : 'text-muted-foreground'}>{isPhotoRequired ? '(Requerida)' : ''}</span>
            </Label>
            <div className="flex items-center gap-4">
              {(imagePreview || result.original_image_url) && (
                <img src={imagePreview || result.original_image_url} alt="Previsualización" className="h-20 w-20 rounded-md object-cover" />
              )}
              <div className="flex flex-1 flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-0 hover:bg-muted hover:text-muted-foreground"
                  onClick={onTakePhoto}
                  disabled={isPing}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {result.image || result.original_image_url ? 'Take another' : 'Take photo'}
                </Button>
                <Button type="button" variant="secondary" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isPing}>
                  <Upload className="mr-2 h-4 w-4" />
                  Browse
                </Button>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="sr-only" accept="image/*" />
            <InputError message={errors?.[`results.${point.id}.image`]} />
          </div>
        </div>
      )}
    </div>
  );
}
