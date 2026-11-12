<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class CartSeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::where('active', true)
        ->where('stock', '>=', 2)
        ->orderBy('id')
        ->take(4)
        ->get();
        if ($products->count() < 4) {
            return;
        }

        $guestCart = Cart::updateOrCreate(
            ['guest_token' => '11111111-1111-4111-8111-111111111111'],
            ['user_id' => null]
        );
        CartItem::updateOrCreate(
            ['cart_id' => $guestCart->id, 'product_id' => $products[0]->id],
            ['quantity' => 1]
        );
        CartItem::updateOrCreate(
            ['cart_id' => $guestCart->id, 'product_id' => $products[1]->id],
            ['quantity' => 2]
        );

        $ana = User::where('email', 'ana@velmora.com')
        ->firstOrFail();

        $userCart = Cart::updateOrCreate(
            ['user_id' => $ana->id],
            ['guest_token' => null]
        );

        CartItem::updateOrCreate(
            ['cart_id' => $userCart->id, 'product_id' => $products[0]->id],
            ['quantity' => 2]
        );

        CartItem::updateOrCreate(
            ['cart_id' => $userCart->id, 'product_id' => $products[2]->id],
            ['quantity' => 1]
        );

        CartItem::updateOrCreate(
            ['cart_id' => $userCart->id, 'product_id' => $products[3]->id],
            ['quantity' => 1]
        );  
    }
}
