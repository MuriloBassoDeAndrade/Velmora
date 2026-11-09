<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Support\Money;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    protected $fillable = [
        'cart_id',
        'product_id',
        'quantity',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
        ];
    }

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    /**
     * Item indisponível: produto removido, inativo ou sem estoque.
     */
    public function isUnavailable(): bool
    {
        $product = $this->product;

        return $product === null
            || $product->trashed()
            || !$product->active
            || $product->stock <= 0;
    }

    /**
     * Subtotal em centavos. Item indisponível vale 0 (não entra no total).
     */
    public function subtotalCents(): int
    {
        if ($this->isUnavailable()) {
            return 0;
        }

        return Money::multiply($this->product->price, $this->quantity);
    }

    /**
     * Item disponível, mas com quantidade acima do estoque atual.
     */
    public function exceedsStock(): bool
    {
        return !$this->isUnavailable()
            && $this->quantity > $this->product->stock;
    }
}
