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
         // --- ACTION 1: Get the search filter from the request ---
        $filters = $request->only(['search']);

        $resolvedStatus = TicketStatus::where('is_closing_status', true)->first();

        $ticketsQuery = Ticket::with(['machine:id,name,image_url', 'creator:id,name', 'status:id,name,bg_color,text_color','inspectionItem:id,image_url'])
            ->latest();

        if ($resolvedStatus) {
            $ticketsQuery->where('ticket_status_id', '!=', $resolvedStatus->id);
        }

        // --- ACTION 2: Apply the search filter to the query ---
        $ticketsQuery->when($filters['search'] ?? null, function ($query, $search) {
            // Search by machine name or ticket title
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhereHas('machine', function ($q2) use ($search) {
                      $q2->where('name', 'like', '%' . $search . '%');
                  });
            });
        });

        $tickets = $ticketsQuery->paginate(15)->withQueryString();

        // --- ACTION 3: Pass the filters back to the view ---
        return Inertia::render('Tickets/Index', [
            'tickets' => $tickets,
            'filters' => $filters,
        ]);
    }

    // We will add the other methods (show, update, etc.) here later.
}
