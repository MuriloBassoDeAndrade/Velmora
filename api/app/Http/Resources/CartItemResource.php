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

        $subtotal = 0;

        if (!$unavailable) {
            $priceInCents = (int) str_replace(
                '.',
                '',
                (string) $product->price
            );

            $subtotal = $priceInCents * $this->quantity;
        }
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'quantity' => $this->quantity,
            'subtotal' => sprintf(
                '%d.%02d',
                intdiv($subtotal, 100),
                $subtotal % 100
            ),

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