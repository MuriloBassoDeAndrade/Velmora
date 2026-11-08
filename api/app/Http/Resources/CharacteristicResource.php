<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CharacteristicResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'gender' => $this->gender,
            'case_shape' => $this->case_shape,
            'movement_type' => $this->movement_type,
            'module_caliber_movement_number' => $this->module_caliber_movement_number,
            'size_perception' => $this->size_perception,
            'case_material' => $this->case_material,
            'main_watch_color' => $this->main_watch_color,
            'strap_color' => $this->strap_color,
            'dial_color' => $this->dial_color,
            'strap_type' => $this->strap_type,
            'dial_style' => $this->dial_style,
            'crystal_type' => $this->crystal_type,
            'crown_and_caseback_type' => $this->crown_and_caseback_type,
            'functions' => $this->functions,
            'water_resistance' => $this->water_resistance,
            'warranty' => $this->warranty,
            'illumination_type' => $this->illumination_type,
            'watch_dimensions' => $this->watch_dimensions,
            'dial_dimensions' => $this->dial_dimensions,
            'thickness' => $this->thickness,
            'weight' => $this->weight,
            'strap_lug_width' => $this->strap_lug_width,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
