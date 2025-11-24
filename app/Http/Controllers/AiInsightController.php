<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AiInsight;

class AiInsightController extends Controller
{
    //
    public function updateStatus(Request $request, AiInsight $insight)
    {
        $request->validate([
            'status' => 'required|in:validated,dismissed'
        ]);

        $insight->update([
            'status' => $request->status,
            // Opcional: Podrías guardar 'is_useful' = true/false también
            'is_useful' => $request->status === 'validated'
        ]);

        return back()->with('success', 'Feedback registrado correctamente.');
    }
}
