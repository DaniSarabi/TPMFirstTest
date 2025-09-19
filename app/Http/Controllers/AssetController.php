<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAssetRequest;
use App\Models\Asset;
use App\Models\AssetGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AssetController extends Controller
{
    /**
     * ACTION: Muestra la página de detalles de un Asset específico.
     */
    public function show(Asset $asset)
    {
        // Cargamos las relaciones que necesitamos en la vista de detalles
        $asset->load('assetGroup', 'tags');

        // Obtenemos los mantenimientos programados para este asset, paginados
        $maintenances = $asset->scheduledMaintenances()
            ->with('template') // Incluimos la plantilla para mostrar su nombre
            ->orderBy('scheduled_date', 'desc') // Ordenamos por fecha
            ->paginate(10, ['*'], 'maintenances_page'); // Paginador específico

        return Inertia::render('Assets/Show', [
            'asset' => $asset,
            'maintenances' => $maintenances,
            'assetGroups' => AssetGroup::orderBy('name')->get(), // Para el modal de edición
        ]);
    }
    /**
     * Muestra la lista de todos los equipos (Assets).
     */
    public function index(Request $request)
    {
        $filters = $request->only('search');
        $assets = Asset::with('assetGroup', 'tags')
            // ACTION: Usamos withCount para contar los mantenimientos pendientes.
            ->withCount(['scheduledMaintenances as pending_maintenances_count' => function ($query) {
                // Definimos "pendiente" como cualquier mantenimiento que no esté 'completed'.
                $query->where('status', '!=', 'completed');
            }])
            ->where('name', 'like', "%{$request->get('search')}%")
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Assets/Index', [
            'assets' => $assets,
            'assetGroups' => AssetGroup::orderBy('name')->get(),
            'filters' => $filters,
        ]);
    }

    /**
     * Almacena un nuevo equipo en la base de datos.
     */
    public function store(StoreAssetRequest $request)
    {
        $data = $request->validated();

        // Generar slug a partir del nombre
        $data['slug'] = Str::slug($data['name']);

        // Manejar la subida de la imagen
        if ($request->hasFile('image')) {
            $data['image_url'] = $request->file('image')->store('assets', 'public');
        }

        Asset::create($data);

        return redirect()->route('assets.index')->with('success', 'Equipment created successfully.');
    }

    /**
     * Actualiza un equipo existente.
     * (Implementación básica para el futuro)
     */
    public function update(Request $request, Asset $asset)
    {
        // Lógica de actualización aquí...
        return redirect()->route('assets.index')->with('success', 'Equipment updated successfully.');
    }

    /**
     * Elimina un equipo.
     * (Implementación básica para el futuro)
     */
    public function destroy(Asset $asset)
    {
        // Lógica de eliminación aquí...
        return redirect()->route('assets.index')->with('success', 'Equipment deleted successfully.');
    }
}
