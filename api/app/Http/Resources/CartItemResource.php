<?php

namespace App\Http\Resources;

use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $product = $this->product;

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'quantity' => $this->quantity,
            'subtotal' => Money::format($this->subtotalCents()),

            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'stock' => $product->stock,
                'active' => $product->active,
            ] : null,

            // Produto removido, inativo ou sem estoque.
            'unavailable' => $this->isUnavailable(),
            // Disponível, mas a quantidade do carrinho passa do estoque atual.
            'exceeds_stock' => $this->exceedsStock(),
        ];
    }
}
