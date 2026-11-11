<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCharacteristicRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'gender' => ['sometimes', 'required', 'string', 'in:Masculino,Feminino,Unissex'],
            'case_shape' => ['sometimes', 'required', 'string', 'max:255'],
            'movement_type' => ['sometimes', 'required', 'string', 'max:255'],
            'module_caliber_movement_number' => ['sometimes', 'required', 'string', 'max:255'],
            'size_perception' => ['sometimes', 'required', 'string', 'max:255'],
            'case_material' => ['sometimes', 'required', 'string', 'max:255'],
            'main_watch_color' => ['sometimes', 'required', 'string', 'max:255'],
            'strap_color' => ['sometimes', 'required', 'string', 'max:255'],
            'dial_color' => ['sometimes', 'required', 'string', 'max:255'],
            'strap_type' => ['sometimes', 'required', 'string', 'max:255'],
            'dial_style' => ['sometimes', 'required', 'string', 'max:255'],
            'crystal_type' => ['sometimes', 'required', 'string', 'max:255'],
            'crown_and_caseback_type' => ['sometimes', 'required', 'string'],
            'functions' => ['sometimes', 'required', 'string'],
            'water_resistance' => ['sometimes', 'required', 'string', 'max:255'],
            'warranty' => ['sometimes', 'required', 'string', 'max:255'],
            'illumination_type' => ['sometimes', 'required', 'string', 'max:255'],
            'watch_dimensions' => ['sometimes', 'required', 'string', 'max:255'],
            'dial_dimensions' => ['sometimes', 'required', 'string', 'max:255'],
            'thickness' => ['sometimes', 'required', 'string', 'max:255'],
            'weight' => ['sometimes', 'required', 'string', 'max:255'],
            'strap_lug_width' => ['sometimes', 'required', 'string', 'max:255'],
        ];
    }
}
