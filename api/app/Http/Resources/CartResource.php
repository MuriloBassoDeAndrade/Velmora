<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $total = 0;

        foreach ($this->items as $item) {
            $product = $item->product;

            $unavailable = !$product
                || $product->trashed()
                || !$product->active
                || $product->stock <= 0;

            if ($unavailable) {
                continue;
            }

            $priceInCents = (int) str_replace(
                '.',
                '',
                (string) $product->price
            );

            $subtotal = $priceInCents * $item->quantity;

            $total += $subtotal;
        }

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'items' => CartItemResource::collection(
                $this->whenLoaded('items')
            ),
            'total' => sprintf(
                '%d.%02d',
                intdiv($total, 100),
                $total % 100
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}