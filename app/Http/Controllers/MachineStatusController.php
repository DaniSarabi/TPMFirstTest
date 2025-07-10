<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\MachineStatus;


class MachineStatusController extends Controller
{
    //
    /**
     * Display a listing of the resource.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        // Fetch all machine statuses from the database
        $statuses = MachineStatus::latest()->get();

        // Render the new Inertia page and pass the statuses as a prop
        return Inertia::render('GeneralSettings/MachineStatus/Index', [
            'statuses' => $statuses,
        ]);
    }

}
