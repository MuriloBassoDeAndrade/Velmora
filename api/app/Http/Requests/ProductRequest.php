<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

abstract class ProductRequest extends FormRequest
{
    protected function characteristicRules(string $containerRule): array
    {
        $fields = [
            'gender' => ['string', 'in:Masculino,Feminino,Unissex'],
            'case_shape' => ['string', 'max:255'],
            'movement_type' => ['string', 'max:255'],
            'module_caliber_movement_number' => ['string', 'max:255'],
            'size_perception' => ['string', 'max:255'],
            'case_material' => ['string', 'max:255'],
            'main_watch_color' => ['string', 'max:255'],
            'strap_color' => ['string', 'max:255'],
            'dial_color' => ['string', 'max:255'],
            'strap_type' => ['string', 'max:255'],
            'dial_style' => ['string', 'max:255'],
            'crystal_type' => ['string', 'max:255'],
            'crown_and_caseback_type' => ['string'],
            'functions' => ['string'],
            'water_resistance' => ['string', 'max:255'],
            'warranty' => ['string', 'max:255'],
            'illumination_type' => ['string', 'max:255'],
            'watch_dimensions' => ['string', 'max:255'],
            'dial_dimensions' => ['string', 'max:255'],
            'thickness' => ['string', 'max:255'],
            'weight' => ['string', 'max:255'],
            'strap_lug_width' => ['string', 'max:255'],
        ];

        $rules = ['characteristics' => [$containerRule, 'array']];

        foreach ($fields as $field => $fieldRules) {
            $rules["characteristics.{$field}"] = array_merge(['required_with:characteristics'], $fieldRules);
        }

        return $rules;
    }
}
