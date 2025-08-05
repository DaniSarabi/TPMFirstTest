<?php

namespace App\Http\Controllers;

use App\Models\EmailContact;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EmailContactController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'sort', 'direction']);

        $contacts = EmailContact::query()
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('department', 'like', '%'.$search.'%');
            })
            ->when($filters['sort'] ?? null, function ($query, $sort) use ($filters) {
                $direction = $filters['direction'] ?? 'asc';
                $query->orderBy($sort, $direction);
            }, function ($query) {
                $query->latest();
            })
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('GeneralSettings/EmailContacts/Index', [
            'contacts' => $contacts,
            'filters' => $filters,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:email_contacts,email|max:255',
            'department' => 'required|string|max:255',
        ]);

        EmailContact::create($validated);

        return back()->with('success', 'Contact created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, EmailContact $emailContact)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('email_contacts')->ignore($emailContact->id)],
            'department' => 'required|string|max:255',
        ]);

        $emailContact->update($validated);

        return back()->with('success', 'Contact updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(EmailContact $emailContact)
    {
        $emailContact->delete();

        return back()->with('success', 'Contact deleted successfully.');
    }
}
