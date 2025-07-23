<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'sort', 'direction']);

        $users = User::with('roles')
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where('name', 'like', '%' . $search . '%')
                      ->orWhere('email', 'like', '%' . $search . '%');
            })
            ->when($filters['sort'] ?? null, function ($query, $sort) use ($filters) {
                $direction = $filters['direction'] ?? 'asc';
                $query->orderBy($sort, $direction);
            }, function ($query) {
                // Default sort order if none is provided
                $query->latest();
            })
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => $filters,
        ]);
    }
    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {

        return Inertia::render("Users/Create", [
            "roles" => Role::pluck("name")
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
        //dd($request->all());

        $request->validate([
            "name" => "required",
            "email" => "required",
            "password" => "required",
        ]);

        $user = User::create(
            $request->only(["name", "email"])
                +
                ["password" => Hash::make($request->password)]
        );

        $user->syncRoles($request->roles);


        return to_route("users.index");
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return Inertia::render('Users/Show', [
            'user' => $user,
            // This is the new line.
            // getRoleNames() is a helper from the Spatie package that returns an array of role names.
            'roles' => $user->getRoleNames(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
        $user = User::find($id);

        return Inertia::render("Users/Edit", [
            "user" => $user,
            "userRoles" => $user->roles()->pluck("name"),
            "roles" => Role::pluck("name"),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
        $request->validate([
            "name" => "required",
            "email" => "required",
        ]);
        $user = User::find($id);

        $user->name = $request->name;
        $user->email = $request->email;

        if ($request->password) {
            $user->password = Hash::make($request->password);
        }
        $user->save();

        $user->syncRoles($request->roles);


        return to_route("users.index");
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
         $user->delete();

        // Redirect the user back to the index page with a success message.
        return to_route('users.index')->with('success', 'User deleted successfully.');
    }
}
