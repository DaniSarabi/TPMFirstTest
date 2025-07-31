<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Behavior;

class TicketController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'view']);
        $viewMode = $filters['view'] ?? 'grid';

        $closingBehavior = Behavior::where('name', 'is_ticket_closing_status')->first();
        $resolvedStatus = $closingBehavior ? $closingBehavior->ticketStatuses()->first() : null;

        $relations = [
            'creator:id,name,avatar_url,avatar_color', // Load all necessary fields
            'status:id,name,bg_color,text_color',
        ];

        if ($viewMode === 'grid') {
            $relations[] = 'machine:id,name,image_url';
            $relations[] = 'inspectionItem:id,image_url';
        } else {
            $relations[] = 'machine:id,name';
        }

        $ticketsQuery = Ticket::with($relations)->latest();

        // If a closing status exists, exclude tickets with that status.
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
            'creator', // Load the full creator object
            'status',
            'inspectionItem:id,image_url,inspection_report_id,inspection_point_id', 
            'inspectionItem.point:id,name,description,subsystem_id',
            'inspectionItem.point.subsystem:id,name',
            'updates' => function ($query) {
                $query->with([
                    'user', // Load the full user object for each update
                    'oldStatus:id,name,bg_color,text_color',
                    'newStatus:id,name,bg_color,text_color',
                    'newMachineStatus:id,name,bg_color,text_color'
                ])->latest();
            }
        ]);

        $solvedBy = null;
        // First, find the status that has the closing behavior.
        $closingStatus = TicketStatus::whereHas('behaviors', function ($query) {
            $query->where('name', 'is_ticket_closing_status');
        })->first();

        if ($closingStatus) {
            // Then, find the first update where the new status matches the closing status ID.
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
