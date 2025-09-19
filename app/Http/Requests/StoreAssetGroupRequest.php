<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAssetGroupRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Obtenemos el ID del grupo desde la ruta, si es que estamos editando.
        $groupId = $this->route('asset_group')?->id;

        return [
            // FIX: Hacemos la regla 'unique' más inteligente. Ignorará su propio
            // nombre cuando estemos actualizando un grupo existente.
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('asset_groups')->ignore($groupId),
            ],

            // FIX: Añadimos la regla de validación para maintenance_type.
            // Esto asegura que el campo se incluya en los datos validados.
            'maintenance_type' => ['required', 'string', Rule::in(['group', 'individual'])],
        ];
    }
}
