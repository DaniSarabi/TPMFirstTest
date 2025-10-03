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
use Illuminate\Database\Eloquent\Builder;
use App\Models\Machine;
use App\Models\TicketUpdate;
use App\Models\User;

class TicketController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $request->validate([
            'view' => 'nullable|string|in:open,all',
            'machines' => 'nullable|array',
            'machines.*' => 'integer|exists:machines,id',
            'statuses' => 'nullable|array',
            'statuses.*' => 'integer|exists:ticket_statuses,id',
            'priorities' => 'nullable|array',
            'priorities.*' => 'integer|in:1,2',
            'user' => 'nullable|integer|exists:users,id',
            'categories' => 'nullable|array',
            'categories.*' => 'string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'include_deleted' => 'nullable|boolean',

        ]);

        $view = $filters['view'] ?? 'open';
        $includeDeleted = $request->boolean('include_deleted');

        $ticketsQuery = Ticket::query()
            ->with([
                'creator:id,name,avatar_url,avatar_color',
                'status:id,name,bg_color,text_color',
                'machine' => fn($q) => $includeDeleted ? $q->withTrashed() : $q,
                'inspectionItem:id,image_url'
            ]);

        if ($view === 'open') {
            $excludedStatuses = TicketStatus::whereHas('behaviors', fn($q) => $q->whereIn('name', ['is_ticket_closing_status', 'is_ticket_discard_status']))->pluck('id');
            $ticketsQuery->whereNotIn('ticket_status_id', $excludedStatuses);
        }

        if (!$includeDeleted) {
            $ticketsQuery->whereHas('machine');
        }

        $ticketsQuery->when($filters['machines'] ?? null, fn(Builder $q, array $ids) => $q->whereIn('machine_id', $ids));
        $ticketsQuery->when($filters['statuses'] ?? null, fn(Builder $q, array $ids) => $q->whereIn('ticket_status_id', $ids));
        $ticketsQuery->when($filters['priorities'] ?? null, fn(Builder $q, array $priorities) => $q->whereIn('priority', $priorities));
        $ticketsQuery->when($filters['user'] ?? null, fn(Builder $q, int $userId) => $q->where('created_by', $userId));
        $ticketsQuery->when($filters['start_date'] ?? null, fn(Builder $q, string $date) => $q->whereDate('created_at', '>=', $date));
        $ticketsQuery->when($filters['end_date'] ?? null, fn(Builder $q, string $date) => $q->whereDate('created_at', '<=', $date));
        $ticketsQuery->when($filters['categories'] ?? null, function (Builder $q, array $categories) {
            $q->whereHas('updates', fn(Builder $subQ) => $subQ->whereIn('category', $categories));
        });

        $tickets = $ticketsQuery->latest()->paginate(12)->withQueryString();

        // ACTION: La consulta de máquinas para el filtro ahora es dinámica.
        $machinesQuery = Machine::orderBy('name');
        if ($includeDeleted) {
            $machinesQuery->withTrashed();
        }


        return Inertia::render('Tickets/Index', [
            'tickets' => $tickets,
            'filters' => $filters,
            'filterOptions' => [
                'allMachines' => $machinesQuery->get(['id', 'name', 'deleted_at']),
                // ACTION: Se cargan los behaviors para que el frontend pueda filtrar los estatus.
                'ticketStatuses' => TicketStatus::with('behaviors')->get(),
                'ticketCreators' => User::whereHas('tickets')->select('id', 'name')->orderBy('name')->get(),
                'resolutionCategories' => TicketUpdate::whereNotNull('category')->distinct()->pluck('category'),
            ],
        ]);
    }


    /**
     * Display the specified resource.
     */
    public function show(Ticket $ticket)
    {
        // Eager-load all the necessary relationships for the details page
        $ticket->load([
            'machine' => fn($query) => $query->withTrashed(),
            'creator', // Load the full creator object
            'status.behaviors',
            'inspectionItem:id,image_url,inspection_report_id,inspection_point_id',
            'inspectionItem.point:id,name,description,subsystem_id',
            'inspectionItem.point.subsystem:id,name',
            'updates' => function ($query) {
                $query->with([
                    'user', // Load the full user object for each update
                    'oldStatus:id,name,bg_color,text_color',
                    'newStatus:id,name,bg_color,text_color',

                    'loggable', // We now load the new polymorphic 'loggable' relationship.
                    'photos',   // The new relationship for solution photos

                ])->latest();
            },
        ]);

        $ticket->is_machine_deleted = $ticket->machine?->trashed();


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

        $relationsForMiniCard = [
            'creator',
            'status',
            'machine' => fn($query) => $query->withTrashed(),
            'inspectionItem'
        ];

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
        if ($remainingLimit > 0 && $ticket->machine) {
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
            'machine.tags', // Load the machine's current tags
            'creator',
            'status',
            'inspectionItem.point.subsystem',
            'updates' => function ($query) {
                $query->with([
                    'user',
                    'oldStatus',
                    'newStatus',
                    'loggable', // Load the new polymorphic relationship for tags
                ])->orderBy('created_at', 'asc'); // Order chronologically for the report
            },
        ]);
        // Load the Blade view and generate the PDF
        $pdf = Pdf::loadView('pdf.ticket-report', ['ticket' => $ticket]);

        // Return the PDF as a download
        return $pdf->download('ticket-report-' . $ticket->id . '.pdf');
    }
}
