// components/Tickets/AttachmentList.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useCan } from '@/lib/useCan';
import { PageProps } from '@/types';
import { Ticket } from '@/types/ticket';
import { router, usePage } from '@inertiajs/react';
import { Download, File, FileText, FileUp, Image, Mail, Trash2 } from 'lucide-react';
// --- NUEVAS IMPORTACIONES ---
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AttachmentUploadPopover } from './AttachmentUploadPopover'; // <-- Importa el nuevo Dialog

// --- (Los helpers getFileIcon y formatBytes se quedan igual) ---
// ... (copia y pega tus helpers getFileIcon y formatBytes aquí) ...

interface AttachmentListProps {
  ticket: Ticket;
}

// --- Helper para íconos ---
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
  if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
  if (fileType === 'message/rfc822' || fileType === 'application/vnd.ms-outlook') return <Mail className="h-5 w-5 text-amber-500" />;
  return <File className="h-5 w-5 text-gray-500" />;
};

// --- Helper para tamaño ---
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export function AttachmentList({ ticket }: AttachmentListProps) {
  const { auth } = usePage<PageProps>().props;
  const canDeleteGlobal = useCan('tickets.delete-attachments');

  return (
    <div className="space-y-4">
      {/* --- HEADER: Título y Botón de Subida --- */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Attachments</h3>
        <AttachmentUploadPopover ticketId={ticket.id} />
      </div>

      {/* --- Estado Vacío --- */}
      {(!ticket.attachments || ticket.attachments.length === 0) && (
        <>
          <div className="flex flex-col items-center justify-center">
            <FileUp className="h-12 w-12" />
            <span>No Attachments Yet</span>
            <p className="text-xs">Upload quotes, emails, or photos related to this ticket.</p>
          </div>
        </>
      )}

      {/* --- NUEVA TABLA DE ARCHIVOS --- */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <div className="relative max-h-96 overflow-y-auto rounded-md border-0">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[50px]">Type</TableHead>
                <TableHead className="">File</TableHead>
                <TableHead className="hidden md:table-cell">Uploader</TableHead>
                <TableHead className="hidden md:table-cell">Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticket.attachments.map((attachment) => {
                const canDelete = auth.user.id === attachment.uploaded_by || canDeleteGlobal;
                return (
                  <TableRow key={attachment.uuid}>
                    <TableCell>{getFileIcon(attachment.file_type)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{attachment.file_name}</div>
                      <div className="text-sm text-muted-foreground">{attachment.description || 'No description'}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{attachment.uploader.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatBytes(attachment.file_size)}</TableCell>
                    <TableCell className="text-right">
                      {/* --- Botones de Acción (más compactos) --- */}
                      <div className="flex justify-end gap-1">
                        <a href={route('attachments.download', attachment.uuid)} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              {/* ... (Tu modal de confirmación de borrado se queda igual) ... */}
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the file <span className="font-medium">"{attachment.file_name}"</span>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="hover:cursor-pointer">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:cursor-pointer hover:bg-destructive/90"
                                  onClick={() => router.delete(route('attachments.destroy', attachment.uuid), { preserveScroll: true })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
