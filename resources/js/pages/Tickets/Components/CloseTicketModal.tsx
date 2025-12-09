import { CameraModal } from '@/components/CameraModal';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Ticket } from '@/types/ticket';
import { useForm } from '@inertiajs/react';
import { BookmarkCheck, Camera, CircleX, Upload, X } from 'lucide-react';
import * as React from 'react';

// The list of categories you provided
const TICKET_CATEGORIES = [
  'ELECTRICO',
  'NEUMATICO',
  'FUGAS',
  'MEDIDAS FUERA DE SPEC',
  'AJUSTES DE SET UP',
  'MAL CORTE',
  'CRITERIOS DE CALIDAD',
  'FALTA DE REFACCION',
  'BOMBAS VACIO',
  'BYPASS',
  'DAÑO/GOLPE',
  'HIDRAULICO',
  'SOLDADURA',
  'MANTTO. PREVENTIVO',
  'PROYECTO',
  'OVERHAUL',
];

interface CloseTicketModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CloseTicketModal({ ticket, isOpen, onOpenChange }: CloseTicketModalProps) {
  // ACTION: Add the '_method: patch' instruction for Laravel.
  // This is called "method spoofing" and is necessary for file uploads to PATCH routes.
  const { data, setData, post, processing, errors, reset } = useForm({
    _method: 'patch',
    action_taken: '',
    parts_used: '',
    category: '',
    photos: [] as File[],
  });

  const [photoPreviews, setPhotoPreviews] = React.useState<string[]>([]);
  const [isCameraModalOpen, setIsCameraModalOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      reset();
      setPhotoPreviews([]);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setData('photos', [...data.photos, ...filesArray]);

      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleCapture = (file: File) => {
    setData('photos', [...data.photos, file]);
    setPhotoPreviews((prev) => [...prev, URL.createObjectURL(file)]);
  };

  const removePhoto = (indexToRemove: number) => {
    setData(
      'photos',
      data.photos.filter((_, index) => index !== indexToRemove),
    );
    setPhotoPreviews(photoPreviews.filter((_, index) => index !== indexToRemove));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // We still use 'post' because of the file upload, but Laravel will
    // see the '_method' field and treat it as a PATCH request.
    post(route('tickets.close', ticket.id), {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Close Ticket #{ticket.id}</DialogTitle>
            <DialogDescription>Provide the resolution details for this ticket. All fields are required.</DialogDescription>
          </DialogHeader>
          <form id="close-ticket-form" onSubmit={submit} className="grid gap-6 py-4">
            {/* Action Taken, Parts Used, and Category fields remain the same */}
            <div className="space-y-2">
              <Label htmlFor="action_taken">Action Taken</Label>
              <Textarea
                className="border-0 ring ring-ring hover:bg-accent"
                id="action_taken"
                value={data.action_taken}
                onChange={(e) => setData('action_taken', e.target.value)}
                placeholder="Describe the specific actions you took..."
                rows={4}
              />
              <InputError message={errors.action_taken} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parts_used">Parts Used (Optional)</Label>
              <Textarea
                className="border-0 ring ring-ring hover:bg-accent"
                id="parts_used"
                value={data.parts_used}
                onChange={(e) => setData('parts_used', e.target.value)}
                placeholder="List any parts or materials used..."
                rows={2}
              />
              <InputError message={errors.parts_used} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Root Cause Category</Label>
              <Select value={data.category} onValueChange={(value) => setData('category', value)}>
                <SelectTrigger className="border-0 ring ring-ring hover:bg-accent" id="category">
                  <SelectValue placeholder="Select a root cause..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {TICKET_CATEGORIES.map((category) => (
                      <SelectItem className="hover:bg-accent" key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <InputError message={errors.category} />
            </div>

            {/* Refactored Photo Uploader section */}
            <div className="space-y-2">
              <Label>Attach Photos (Optional)</Label>
              <div className="flex flex-wrap items-center gap-4">
                {photoPreviews.map((previewUrl, index) => (
                  <div key={index} className="relative h-24 w-24">
                    <img src={previewUrl} className="h-full w-full rounded-md object-cover" alt={`Preview ${index + 1}`} />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {/* "Take Picture" button */}
                <div
                  className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-primary/50 bg-background text-primary hover:bg-accent"
                  onClick={() => setIsCameraModalOpen(true)}
                >
                  <Camera className="h-8 w-8" />
                  <span className="text-xs font-semibold">Take Picture</span>
                </div>
                {/* "Upload File" button */}
                <div className="flex h-full flex-col justify-center">
                  <Button className="h-24" type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                </div>
              </div>
              <input ref={fileInputRef} id="photos-upload" type="file" multiple onChange={handleFileChange} className="sr-only" />
              <InputError message={errors.photos} />
            </div>
          </form>
          <DialogFooter>
            <Button
              className="hover:cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <CircleX />
              Cancel
            </Button>
            <Button className="hover:cursor-pointer" type="submit" form="close-ticket-form" disabled={processing}>
              <BookmarkCheck className="mr-2 h-4 w-4" />
              {processing ? 'Closing...' : 'Confirm and Close Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CameraModal isOpen={isCameraModalOpen} onOpenChange={setIsCameraModalOpen} onCapture={handleCapture} />
    </>
  );
}
