<?php

namespace App\Http\Controllers;

use App\Models\Behavior;
use App\Models\EmailContact;
use App\Models\Ticket;
use App\Models\TicketStatus;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TicketController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'view', 'statuses']);
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

        $ticketsQuery->when($filters['statuses'] ?? null, function ($query, $statusFilter) {
            // If specific statuses are requested, use them.
            $query->whereIn('ticket_status_id', $statusFilter);
        }, function ($query) {
            // Otherwise, show all tickets that are NOT resolved by default.
            $resolvedStatus = TicketStatus::whereHas('behaviors', function ($q) {
                $q->where('name', 'is_ticket_closing_status');
            })->first();
            if ($resolvedStatus) {
                $query->where('ticket_status_id', '!=', $resolvedStatus->id);
            }
        });

        $ticketsQuery->when($filters['search'] ?? null, function ($query, $search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%'.$search.'%')
                    ->orWhereHas('machine', function ($q2) use ($search) {
                        $q2->where('name', 'like', '%'.$search.'%');
                    });
            });
        });

        $tickets = $ticketsQuery->paginate(12)->withQueryString();

        return Inertia::render('Tickets/Index', [
            'tickets' => $tickets,
            'filters' => $filters,
            'ticketStatuses' => TicketStatus::all(),

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
                    'newMachineStatus:id,name,bg_color,text_color',
                ])->latest();
            },
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

        $relatedTickets = collect();
        $limit = 5;

        $relationsForMiniCard = ['creator', 'status', 'machine', 'inspectionItem'];

        if ($ticket->inspectionItem) {
            // 1. Find by same inspection point
            $pointTickets = Ticket::with($relationsForMiniCard) // Eager-load relations
                ->whereHas('inspectionItem', function ($query) use ($ticket) {
                    $query->where('inspection_point_id', $ticket->inspectionItem->inspection_point_id);
                })
                ->where('id', '!=', $ticket->id)
                ->latest()
                ->limit($limit)
                ->get();

            $relatedTickets = $relatedTickets->merge($pointTickets);
        }

        // 2. Si aún no tenemos 5, buscar por la misma máquina
        $remainingLimit = $limit - $relatedTickets->count();
        if ($remainingLimit > 0) {
            $machineTickets = Ticket::with($relationsForMiniCard) // Eager-load relations
                ->where('machine_id', $ticket->machine_id)
                ->where('id', '!=', $ticket->id)
                ->whereNotIn('id', $relatedTickets->pluck('id'))
                ->latest()
                ->limit($remainingLimit)
                ->get();

            $relatedTickets = $relatedTickets->merge($machineTickets);
        }

        $timeOpen = $ticket->created_at->diffForHumans(null, true);

        $availableStatuses = TicketStatus::whereDoesntHave('behaviors', function ($query) {
            $query->where('name', 'is_ticket_closing_status');
        })->get();

        return Inertia::render('Tickets/Show', [
            'ticket' => $ticket,
            'timeOpen' => $timeOpen,
            'solvedBy' => $solvedBy,
            'statuses' => $availableStatuses,
            'purchasingContacts' => EmailContact::where('department', 'Purchasing')->get(),
            'relatedTickets' => $relatedTickets,
        ]);
    }

    /**
     * Generate and download a PDF for the specified ticket.
     */
    public function downloadPDF(Ticket $ticket)
    {
        // Eager-load all the necessary relationships for the PDF report
        $ticket->load([
            'machine',
            'creator',
            'status',
            'inspectionItem.point.subsystem',
            'updates.user',
            'updates.oldStatus',
            'updates.newStatus',
            'updates.newMachineStatus',
        ]);

        // Load the Blade view and generate the PDF
        $pdf = Pdf::loadView('pdf.ticket-report', ['ticket' => $ticket]);

        // Return the PDF as a download
        return $pdf->download('ticket-report-'.$ticket->id.'.pdf');
    }
}
