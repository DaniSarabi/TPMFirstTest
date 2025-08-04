import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Circle, CircleAlert, CircleCheck, CircleX, ImagePlus } from 'lucide-react';
import * as React from 'react';
import { InspectionPoint, InspectionStatus } from '../Perform'; // Assuming types are exported from Perform.tsx

// Define the shape of the result data for a single point
export type InspectionResult = {
  status_id?: number;
  comment?: string;
  image?: File | null;
  pinged_ticket_id?: number | null;
};

interface InspectionPointRowProps {
  point: InspectionPoint;
  statuses: InspectionStatus[];
  result: InspectionResult;
  onResultChange: (newResult: InspectionResult) => void;
  onStatusChange: (pointId: number, statusId: number) => void; // Add this prop
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

export function InspectionPointRow({ point, statuses, result, onResultChange, onStatusChange }: InspectionPointRowProps) {
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const selectedStatus = statuses.find((s) => s.id === result.status_id);

  const isPhotoRequired = !result.pinged_ticket_id;
  const isCommentRequired = selectedStatus && selectedStatus.severity > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onResultChange({ ...result, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onResultChange({ ...result, comment: e.target.value });
  };

  return (
    <div className="mb-4 flex flex-col rounded-md bg-muted/30 p-2 shadow-lg shadow-primary drop-shadow-lg transition-colors hover:bg-muted">
      {/* Main Row: Point Name and Status Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon status={selectedStatus} />
          <div>
            <p className="font-medium">{point.name}</p>
            <p className="line-clamp-2 text-sm font-light text-muted-foreground/50 italic">{point.description || 'No description provided.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={result.status_id ? String(result.status_id) : ''} onValueChange={(value) => onStatusChange(point.id, Number(value))}>
            <SelectTrigger className="w-[180px] bg-accent shadow-sm">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status.id} value={String(status.id)}>
                  <div className="flex items-center">
                    <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: status.bg_color }} />
                    <span>{status.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inline Details Section (conditionally shown) */}
      {selectedStatus && (
        <div className="mt-4 grid grid-cols-1 gap-4 pl-7 md:grid-cols-2">
          <div className="space-y-2 ">
            <Label htmlFor={`comment-${point.id}`}>
              Comment <span className={isCommentRequired ? 'text-red-500' : 'text-blue-500'}>{isCommentRequired ? '(Required)' : '(Optional)'}</span>
            </Label>{' '}
            <Textarea
              id={`comment-${point.id}`}
              value={result.comment || ''}
              onChange={handleCommentChange}
              placeholder="Describe the situation or issue..."
              required={isCommentRequired}
              className="ring-1 hover:bg-accent hover:ring-primary hover:text-accent-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`image-${point.id}`}>Photo <span className={isPhotoRequired ? 'text-red-500' : 'text-blue-500'}>{isPhotoRequired ? '(Required)' : ''}</span>
                
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id={`image-${point.id}`}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="flex-1 ring-1 hover:bg-accent hover:ring-primary"
                required={isPhotoRequired}
              />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-24 w-24 rounded-md object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-md border-0 ">
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
