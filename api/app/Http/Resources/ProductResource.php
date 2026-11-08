<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\CharacteristicResource;

class ProductResource extends JsonResource
{

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category' => new CategoryResource(
                $this->whenLoaded('category')
            ),

            'characteristics' => new CharacteristicResource(
                $this->whenLoaded('characteristics')
            ),
            'name' => $this->name,
            'description' => $this->description,
            'brand' => $this->brand,
            'price' => $this->price,
            'stock' => $this->stock,
            'image_url' => $this->image_url,
            'active' => $this->active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at
        ];
    }
}
