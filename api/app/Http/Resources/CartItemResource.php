<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $product = $this->product;

        $unavailable = !$product
            || $product->trashed()
            || !$product->active
            || $product->stock <= 0;
        $subtotal = $product
            ? $product->price * $this->quantity
            : 0;
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'quantity' => $this->quantity,
            'subtotal' => number_format($subtotal, 2, '.', ''),

            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'stock' => $product->stock,
                'active' => $product->active,
            ] : null,

            'unavailable' => $unavailable,
        ];
    }
}