<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAssetRequest;
use App\Models\Asset;
use App\Models\AssetGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Builder;

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
        $search = $request->get('search', '');

        // --- 1. Obtenemos los grupos que deben mostrarse como "tarjeta de teléfono" ---
        $assetGroups = AssetGroup::where('maintenance_type', 'group')
            // ACTION: Modificamos el 'with' para que cada asset miembro traiga su propio
            // contador de mantenimientos pendientes.
            ->with([
                'assets' => function ($query) {
                    $query->with('tags')->withCount(['scheduledMaintenances as pending_maintenances_count' => function ($q) {
                        $q->where('status', '!=', 'completed');
                    }]);
                },
                'machines.tags'
            ])
            ->when($search, function (Builder $query, string $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhereHas('assets', fn(Builder $q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('machines', fn(Builder $q) => $q->where('name', 'like', "%{$search}%"));
            })
            ->orderBy('name')
            ->get();

        // --- 2. Obtenemos los equipos que se muestran como tarjetas individuales ---
        $individualAssets = Asset::with(['assetGroup', 'tags'])
            ->withCount(['scheduledMaintenances as pending_maintenances_count' => function ($query) {
                $query->where('status', '!=', 'completed');
            }])
            ->where(function (Builder $query) {
                $query->whereNull('asset_group_id')
                    ->orWhereHas('assetGroup', function (Builder $q) {
                        $q->where('maintenance_type', 'individual');
                    });
            })
            ->when($search, function (Builder $query, string $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Assets/Index', [
            'assetGroups' => $assetGroups,
            'individualAssets' => $individualAssets,
            'allAssetGroups' => AssetGroup::orderBy('name')->get(),
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
     * Actualiza un Asset existente.
     */
    public function update(StoreAssetRequest $request, Asset $asset)
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['name']);

        if ($request->hasFile('image')) {
            // 1. Borramos la imagen anterior para no dejar basura.
            if ($asset->image_url) {
                Storage::disk('public')->delete($asset->image_url);
            }
            // 2. Subimos la nueva imagen.
            $data['image_url'] = $request->file('image')->store('assets', 'public');
        }

        // 3. Actualizamos el registro en la base de datos.
        $asset->update($data);

        return back()->with('success', 'Equipment updated successfully!');
    }

    /**
     * Elimina un Asset.
     */
    public function destroy(Asset $asset)
    {
        // 1. Borramos la imagen asociada del almacenamiento.
        if ($asset->image_url) {
            Storage::disk('public')->delete($asset->image_url);
        }

        // 2. Eliminamos el registro de la base de datos.
        $asset->delete();

        return redirect()->route('assets.index')->with('success', 'Equipment deleted successfully!');
    }
}
