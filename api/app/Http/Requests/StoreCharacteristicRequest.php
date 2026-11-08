<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCharacteristicRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'gender' => ['required', 'string', 'max:255'],
            'case_shape' => ['required', 'string', 'max:255'],
            'movement_type' => ['required', 'string', 'max:255'],
            'module_caliber_movement_number' => ['required', 'string', 'max:255'],
            'size_perception' => ['required', 'string', 'max:255'],
            'case_material' => ['required', 'string', 'max:255'],
            'main_watch_color' => ['required', 'string', 'max:255'],
            'strap_color' => ['required', 'string', 'max:255'],
            'dial_color' => ['required', 'string', 'max:255'],
            'strap_type' => ['required', 'string', 'max:255'],
            'dial_style' => ['required', 'string', 'max:255'],
            'crystal_type' => ['required', 'string', 'max:255'],
            'crown_and_caseback_type' => ['required', 'string'],
            'functions' => ['required', 'string'],
            'water_resistance' => ['required', 'string', 'max:255'],
            'warranty' => ['required', 'string', 'max:255'],
            'illumination_type' => ['required', 'string', 'max:255'],
            'watch_dimensions' => ['required', 'string', 'max:255'],
            'dial_dimensions' => ['required', 'string', 'max:255'],
            'thickness' => ['required', 'string', 'max:255'],
            'weight' => ['required', 'string', 'max:255'],
            'strap_lug_width' => ['required', 'string', 'max:255'],
        ];
    }
}
