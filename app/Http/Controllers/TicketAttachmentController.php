<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Http\Requests\StoreAttachmentRequest; // <-- Seguimos usando el FormRequest para validación
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

// No necesitamos Gate ni Policies

class TicketAttachmentController extends Controller
{
    /**
     * Almacena un nuevo adjunto para un ticket.
     */
    public function store(StoreAttachmentRequest $request, Ticket $ticket)
    {
        // El middleware 'permission:tickets.perform' en la ruta ya 
        // validó que el usuario tiene permiso para actuar sobre tickets.

        $file = $request->file('file');

        // Guardamos en 'private' para que no sean accesibles por URL
        $path = $file->store("attachments/ticket_{$ticket->id}", 'local');
        $filename = $file->getClientOriginalName();

        $attachment = $ticket->attachments()->create([
            'uploaded_by' => Auth::id(),
            'file_name'   => $filename,
            'file_path'   => $path,
            'file_type'   => $file->getMimeType(),
            'file_size'   => $file->getSize(),
            'description' => $request->input('description'),
        ]);

        $ticket->updates()->create([
            'user_id' => Auth::id(),
            // Usamos la descripción (si existe) o el nombre del archivo como comentario
            'comment' => "Attached the file named: {$filename}",
            'action'  => 'attached', // Un nuevo tipo de acción para el frontend
            'loggable_id'   => $attachment->id,
            'loggable_type' => TicketAttachment::class, // Referenciamos el modelo
        ]);

        return back()->with('success', 'Archivo subido exitosamente.');
    }

    /**
     * Descarga un adjunto de forma segura.
     */
    public function download(TicketAttachment $attachment)
    {
        // El middleware 'permission:tickets.view' en la ruta ya validó
        // que el usuario tiene permiso general para ver tickets.
        // (Esto es menos seguro que una policy, pero es lo que solicitaste).

        if (!Storage::disk('local')->exists($attachment->file_path)) {
            abort(404, 'Archivo no encontrado.');
        }

        // Servimos el archivo con su nombre original
        return Storage::disk('local')->download($attachment->file_path, $attachment->file_name);
    }

    /**
     * Elimina un adjunto.
     */
    public function destroy(TicketAttachment $attachment)
    {
        // Esta es la lógica "Punto 1" (Propietario O Rol)
        // Nota: Aún necesitamos auth()->user()->can() para el check de Spatie
        if (Auth::id() !== $attachment->uploaded_by && !Auth::user()->can('tickets.delete-attachments')) {
            abort(403, 'No tienes permiso para eliminar este archivo.');
        }
        $filename = $attachment->file_name;

        $attachment->ticket->updates()->create([
            'user_id' => Auth::id(),
            'comment' => "Detached the file named: {$filename}", // <-- Mensaje de sistema consistente            'action'  => 'detached', // Un nuevo tipo de acción
            'loggable_id'   => $attachment->id,
            'loggable_type' => TicketAttachment::class,
            'action'  => 'detached',
        ]);

        // Si pasa el check, borramos todo
        Storage::disk('local')->delete($attachment->file_path);
        $attachment->delete();

        return back()->with('success', 'Archivo eliminado exitosamente.');
    }
}
