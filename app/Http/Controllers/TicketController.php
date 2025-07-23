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

    // We will add the other methods (show, update, etc.) here later.
}
