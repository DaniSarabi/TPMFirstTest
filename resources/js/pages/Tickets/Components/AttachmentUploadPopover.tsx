import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'; // <-- Cambiamos Dialog por Popover
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { FileUp, SendHorizonal, X } from 'lucide-react';
import * as React from 'react';

interface AttachmentUploadPopoverProps {
  ticketId: number;
}

export function AttachmentUploadPopover({ ticketId }: AttachmentUploadPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { data, setData, post, processing, errors, reset, progress } = useForm({
    file: null as File | null,
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('tickets.attachments.store', ticketId), {
      preserveScroll: true,
      onSuccess: () => {
        reset('file', 'description');
        setIsOpen(false); // Cierra el popover al éxito
      },
    });
  };

  // Limpia el form si se cierra el popover sin enviar
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset('file', 'description');
      // Pequeño delay para que el reset no se vea feo al cerrar
      setTimeout(() => reset(), 150); 
    }
    setIsOpen(open);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className='border-0 shadow-none '>
          <FileUp className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 border-0 shadow-none drop-shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <h4 className="font-medium leading-none">Upload Attachment</h4>
            <p className="text-sm text-muted-foreground">Select a file and add a description.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload-popover">File</Label>
            <Input
              id="file-upload-popover"
              type="file"
              className="file:text-primary bg-muted hover:cursor-pointer border-0 shadow-none"
              onChange={(e) => setData('file', e.target.files ? e.target.files[0] : null)}
            />
            
            {errors.file && <p className="text-sm text-destructive">{errors.file}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description-popover">Description (optional)</Label>
            <Textarea
              id="description-popover"
              placeholder="e.g. 'Quote from provider...'"
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              className="min-h-[60px] bg-muted  border-0 shadow-none" // Más pequeño para el popover
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          {progress && <Progress value={progress.percentage} className="w-full" />}

          <Button type="submit" disabled={processing || !data.file} className="w-full">
            <SendHorizonal className="mr-2 h-4 w-4" />
            {processing ? 'Uploading...' : 'Upload File'}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}