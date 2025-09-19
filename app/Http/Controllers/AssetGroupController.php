<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAssetGroupRequest;
use App\Models\AssetGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AssetGroupController extends Controller
{
    /**
     * Almacena un nuevo grupo en la base de datos.
     */
    public function store(StoreAssetGroupRequest $request)
    {
        // FIX: Nos aseguramos de tomar TODOS los datos validados del request.
        $validatedData = $request->validated();

        //dd($request->all());

        //dd($validatedData);

        // Creamos el slug a partir del nombre validado.
        $validatedData['slug'] = Str::slug($validatedData['name']);

        // Creamos el grupo con el array completo de datos.
        AssetGroup::create($validatedData);

        return back()->with('success', 'Group created successfully.');
    }

    /**
     * Actualiza un grupo.
     * (Implementación básica para el futuro)
     */
    public function update(Request $request, AssetGroup $assetGroup)
    {
        //add the group to the validation]
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'maintenance_type' => 'required|string',
        ]);
        $assetGroup->update([
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
            'maintenance_type' => $data['maintenance_type'],
        ]);
        return back()->with('success', 'Group updated successfully.');
    }

    /**
     * Elimina un grupo.
     */
    public function destroy(AssetGroup $assetGroup)
    {
        // La restricción onDelete('set null') en la migración se encargará
        // de poner en NULL el asset_group_id en las tablas assets y machines.
        $assetGroup->delete();

        return back()->with('success', 'Group deleted successfully.');
    }
}
