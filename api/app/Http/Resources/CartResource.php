<?php

namespace App\Http\Resources;

use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'items' => CartItemResource::collection($this->whenLoaded('items')),
            'total' => Money::format($this->totalCents()),
            'has_unavailable_items' => $this->items->contains(
                fn ($item) => $item->isUnavailable()
            ),
            'has_items_exceeding_stock' => $this->items->contains(
                fn ($item) => $item->exceedsStock()
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
