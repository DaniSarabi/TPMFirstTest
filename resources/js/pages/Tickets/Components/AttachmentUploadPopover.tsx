import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { FileUp, SendHorizonal, X, File as FileIcon } from 'lucide-react'; // 1. Importar FileIcon y X
import * as React from 'react';

// 2. Definir las nuevas props que recibe (¡ahora es un componente "tonto"!)
interface AttachmentUploadPopoverProps {
  ticketId: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Pasamos todo el 'useForm' como props
  data: { file: File | null; description: string };
  setData: (key: 'file' | 'description', value: any) => void;
  post: (route: string, options?: any) => void;
  processing: boolean;
  errors: any;
  reset: (key1: string, key2: string) => void;
  progress: { percentage: number } | null;
}

export function 
AttachmentUploadPopover({
  ticketId,
  isOpen,
  onOpenChange,
  data,
  setData,
  post,
  processing,
  errors,
  reset,
  progress
}: AttachmentUploadPopoverProps) {
  
  // 3. El submit ahora usa las props
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('tickets.attachments.store', ticketId), {
      preserveScroll: true,
      onSuccess: () => {
        reset('file', 'description');
        onOpenChange(false); // Cierra el popover al éxito
      },
    });
  };

  // Limpia el form si se cierra el popover sin enviar
  const handleOpenChange = (open: boolean) => {
    if (!open && !processing) {
      reset('file', 'description');
    }
    onOpenChange(open);
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
            
            {/* --- 4. ¡LA LÓGICA DE PREVIEW! --- */}
            {data.file ? (
              // Si hay un archivo (por drop o por select), mostramos el preview
              <div className="flex items-center justify-between rounded-md border bg-muted p-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">{data.file.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => setData('file', null)} // Botón para quitar
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              // Si no hay archivo, mostramos el input
              <Input
                id="file-upload-popover"
                type="file"
                className="file:text-primary bg-muted hover:cursor-pointer border-0 shadow-none"
                onChange={(e) => setData('file', e.target.files ? e.target.files[0] : null)}
              />
            )}
            {errors.file && <p className="text-sm text-destructive">{errors.file}</p>}
          </div>
          {/* --- FIN DEL PREVIEW --- */}

          <div className="space-y-2">
            <Label htmlFor="description-popover">Description (optional)</Label>
            <Textarea
              id="description-popover"
              placeholder="e.g. 'Quote from provider...'"
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              className="min-h-[60px] bg-muted  border-0 shadow-none"
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