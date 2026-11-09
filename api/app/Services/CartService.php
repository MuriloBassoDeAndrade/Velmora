<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function getOrCreateUserCart(User $user): Cart
    {
        return $user->cart()->firstOrCreate([
            'user_id' => $user->id,
        ]);
    }

    public function getOrCreateGuestCart(?string $guestToken = null): Cart
    {
        if ($guestToken === null) {
            $guestToken = (string) Str::uuid();
        }

        if (!Str::isUuid($guestToken)) {
            throw ValidationException::withMessages([
                'guest_token' => 'Invalid guest token.',
            ]);
        }

        return Cart::query()->firstOrCreate([
            'guest_token' => $guestToken,
        ]);
    }

    public function getCart(Cart $cart): Cart
    {
        return $cart->load('items.product');
    }

    public function addItem(
        Cart $cart,
        Product $product,
        int $quantity
    ): CartItem {
        return DB::transaction(function () use ($cart, $product, $quantity) {

            if ($quantity <= 0) {
                throw ValidationException::withMessages([
                    'quantity' => 'Quantity must be greater than zero.',
                ]);
            }

            $lockedCart = Cart::query()
                ->whereKey($cart->id)
                ->lockForUpdate()
                ->firstOrFail();

            $lockedProduct = Product::withTrashed()
                ->whereKey($product->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedProduct->trashed()) {
                throw ValidationException::withMessages([
                    'product' => 'Product is deleted.',
                ]);
            }

            if (!$lockedProduct->active) {
                throw ValidationException::withMessages([
                    'product' => 'Product is not active.',
                ]);
            }

            $cartItem = $lockedCart->items()
                ->where('product_id', $lockedProduct->id)
                ->first();

            $totalQuantity = $quantity + ($cartItem->quantity ?? 0);

            if ($totalQuantity > $lockedProduct->stock) {
                throw ValidationException::withMessages([
                    'quantity' => 'Quantity exceeds available stock.',
                ]);
            }

            $cartItem = $lockedCart->items()->firstOrCreate(
                ['product_id' => $lockedProduct->id],
                ['quantity' => $quantity]
            );

            if (!$cartItem->wasRecentlyCreated) {
                $cartItem->increment('quantity', $quantity);
            }

            return $cartItem->refresh();
        }, 3);
    }

    public function updateItem(
        Cart $cart,
        int $idCartItem,
        int $quantity
    ): CartItem {
        return DB::transaction(function () use ($cart, $idCartItem, $quantity) {

            if ($quantity <= 0) {
                throw ValidationException::withMessages([
                    'quantity' => 'Quantity must be greater than zero.',
                ]);
            }

            $lockedCart = Cart::query()
                ->whereKey($cart->id)
                ->lockForUpdate()
                ->firstOrFail();

            $cartItem = $lockedCart->items()->findOrFail($idCartItem);

            $lockedProduct = Product::withTrashed()
                ->whereKey($cartItem->product_id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedProduct->trashed()) {
                throw ValidationException::withMessages([
                    'product' => 'Product is deleted.',
                ]);
            }

            if (!$lockedProduct->active) {
                throw ValidationException::withMessages([
                    'product' => 'Product is not active.',
                ]);
            }

            if ($quantity > $lockedProduct->stock) {
                throw ValidationException::withMessages([
                    'quantity' => 'Quantity exceeds available stock.',
                ]);
            }

            $cartItem->update([
                'quantity' => $quantity,
            ]);

            return $cartItem->refresh();
        }, 3);
    }

    public function removeItem(Cart $cart, int $idCartItem): void
    {
        DB::transaction(function () use ($cart, $idCartItem) {

            $lockedCart = Cart::query()
                ->whereKey($cart->id)
                ->lockForUpdate()
                ->firstOrFail();

            $cartItem = $lockedCart->items()->findOrFail($idCartItem);

            $cartItem->delete();
        }, 3);
    }

    public function mergeCarts(
        User $user,
        Cart $guestCart,
        string $guestToken
    ): Cart {
        return DB::transaction(function () use ($user, $guestCart, $guestToken) {

            $lockedUser = User::query()
                ->whereKey($user->id)
                ->lockForUpdate()
                ->firstOrFail();

            $lockedGuestCart = Cart::query()
                ->whereKey($guestCart->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (
                $lockedGuestCart->user_id !== null ||
                $lockedGuestCart->guest_token === null ||
                !Str::isUuid($guestToken) ||
                !hash_equals($lockedGuestCart->guest_token, $guestToken)
            ) {
                throw ValidationException::withMessages([
                    'cart' => 'Invalid guest cart.',
                ]);
            }

            $userCart = $this->getOrCreateUserCart($lockedUser);

            $userCart = Cart::query()
                ->whereKey($userCart->id)
                ->lockForUpdate()
                ->firstOrFail();

            $guestItems = $lockedGuestCart->items()
                ->orderBy('product_id')
                ->get();

            foreach ($guestItems as $guestItem) {

                $lockedProduct = Product::withTrashed()
                    ->whereKey($guestItem->product_id)
                    ->lockForUpdate()
                    ->first();

                if (
                    $lockedProduct === null ||
                    $lockedProduct->trashed() ||
                    !$lockedProduct->active
                ) {
                    $guestItem->delete();
                    continue;
                }

                $userItem = $userCart->items()
                    ->where('product_id', $lockedProduct->id)
                    ->first();

                $currentQuantity = $userItem->quantity ?? 0;

                $totalQuantity = $currentQuantity + $guestItem->quantity;

                $finalQuantity = min(
                    $totalQuantity,
                    $lockedProduct->stock
                );

                if ($userItem !== null && $finalQuantity > 0) {
                    $userItem->update([
                        'quantity' => $finalQuantity,
                    ]);
                } elseif ($userItem === null && $finalQuantity > 0) {
                    $userCart->items()->create([
                        'product_id' => $lockedProduct->id,
                        'quantity' => $finalQuantity,
                    ]);
                } elseif ($userItem !== null && $finalQuantity === 0) {
                    $userItem->delete();
                }
            }

            $lockedGuestCart->delete();

            return $userCart->load('items.product');
        }, 3);
    }
}
