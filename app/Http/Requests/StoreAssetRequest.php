<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssetRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     *
     * Este método es la clave para el 'asset_group_id'.
     * Si el frontend envía el string 'null', lo convertimos a un valor null real
     * ANTES de que se apliquen las reglas de validación.
     */
    protected function prepareForValidation(): void
    {
        if ($this->asset_group_id === 'null') {
            $this->merge([
                'asset_group_id' => null,
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Obtenemos el ID del asset desde la ruta. Será null al crear.
        $assetId = $this->route('asset') ? $this->route('asset')->id : null;

        return [
            // FIX: La regla 'unique' ahora ignora el ID del asset actual al editar.
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('assets', 'name')->ignore($assetId),
            ],
            // FIX: Esta regla ahora es segura gracias a prepareForValidation.
            'asset_group_id' => 'nullable|exists:asset_groups,id',
            // Esta regla está bien, permite que la imagen no se envíe.
            'image' => 'nullable|image|max:2048',
        ];
    }
}
