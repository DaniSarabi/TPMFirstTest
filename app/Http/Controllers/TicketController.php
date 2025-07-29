<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketController extends Controller
{
    /**
     * Display a listing of the resource.
     * This will be the main dashboard for active tickets.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'view']);
        $viewMode = $filters['view'] ?? 'grid'; // Default to grid view

        $resolvedStatus = TicketStatus::where('is_closing_status', true)->first();

        // --- ACTION 1: Conditionally load relationships based on the view ---
        $relations = [
            'creator:id,name',
            'status:id,name,bg_color,text_color',
        ];

        if ($viewMode === 'grid') {
            // Grid view needs richer data
            $relations[] = 'machine:id,name,image_url';
            $relations[] = 'inspectionItem:id,image_url';
        } else {
            // List view only needs the machine name
            $relations[] = 'machine:id,name';
        }

        $ticketsQuery = Ticket::with($relations)->latest();

        if ($resolvedStatus) {
            $ticketsQuery->where('ticket_status_id', '!=', $resolvedStatus->id);
        }

        $ticketsQuery->when($filters['search'] ?? null, function ($query, $search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhereHas('machine', function ($q2) use ($search) {
                        $q2->where('name', 'like', '%' . $search . '%');
                    });
            });
        });

        $tickets = $ticketsQuery->paginate(12)->withQueryString();

        return Inertia::render('Tickets/Index', [
            'tickets' => $tickets,
            'filters' => $filters,
            // We will add other filter data here later (e.g., all statuses, priorities)
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Ticket $ticket)
    {
        // Eager-load all the necessary relationships for the details page
        $ticket->load([
            'machine.machineStatus',
            'creator:id,name',
            'status',
            'inspectionItem.point.subsystem',
            'updates' => function ($query) {
                $query->with(['user:id,name', 'oldStatus:id,name,bg_color,text_color', 'newStatus:id,name,bg_color,text_color', 'newMachineStatus:id,name,bg_color,text_color'])->latest();
            }
        ]);

        // First, find the single status that is marked as the closing status.
        $closingStatus = TicketStatus::where('is_closing_status', true)->first();
        $solvedBy = null;

        // Only proceed if a closing status actually exists
        if ($closingStatus) {
            // Then, find the first update for this ticket where the new status matches the closing status ID.
            $closingUpdate = $ticket->updates->first(function ($update) use ($closingStatus) {
                return $update->new_status_id === $closingStatus->id;
            });

            // If we found that update, the user who made it is the one who solved the ticket.
            $solvedBy = $closingUpdate ? $closingUpdate->user : null;
        }

        $timeOpen = $ticket->created_at->diffForHumans(null, true);

        return Inertia::render('Tickets/Show', [
            'ticket' => $ticket,
            'timeOpen' => $timeOpen,
            'solvedBy' => $solvedBy,
        ]);
    }
}
