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
    public function index()
    {
        return Inertia::render("Users/Index", [
            "users" => User::with("roles")->get()
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
