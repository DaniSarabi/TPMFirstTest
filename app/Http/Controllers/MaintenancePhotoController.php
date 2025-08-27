<?php

namespace App\Http\Controllers;

use App\Models\MaintenancePhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;

class MaintenancePhotoController extends Controller
{
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MaintenancePhoto $maintenancePhoto)
    {
        // Add authorization logic here if needed, e.g., Gate::authorize(...)

        // Delete the physical file from storage
        Storage::disk('public')->delete($maintenancePhoto->photo_url);

        // Delete the database record
        $maintenancePhoto->delete();

        return Redirect::back()->with('success', 'Photo deleted successfully.');
    }
}
