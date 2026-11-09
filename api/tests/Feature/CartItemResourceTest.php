<?php

namespace Tests\Feature;

use App\Http\Resources\CartItemResource;
use App\Models\Category;
use App\Models\Characteristic;
use App\Models\Product;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;
use Illuminate\Support\Str;

class CartItemResourceTest extends TestCase
{
    use RefreshDatabase;

    private function createProduct(array $attributes = []): Product
    {
        $category = Category::create([
            'name' => 'Casual',
            'slug' => 'casual',
        ]);

        $characteristic = Characteristic::create([
            'gender' => 'Masculino',
            'case_shape' => 'Redondo',
            'movement_type' => 'Quartz',
            'module_caliber_movement_number' => '1234',
            'size_perception' => 'Médio',
            'case_material' => 'Aço',
            'main_watch_color' => 'Prata',
            'strap_color' => 'Preto',
            'dial_color' => 'Preto',
            'strap_type' => 'Metal',
            'dial_style' => 'Analógico',
            'crystal_type' => 'Mineral',
            'crown_and_caseback_type' => 'Rosqueada',
            'functions' => 'Horas e minutos',
            'water_resistance' => '50m',
            'warranty' => '1 ano',
            'illumination_type' => 'LED',
            'watch_dimensions' => '40mm',
            'dial_dimensions' => '35mm',
            'thickness' => '10mm',
            'weight' => '100g',
            'strap_lug_width' => '20mm',
        ]);

        return Product::create(array_merge([
            'name' => 'Relógio de teste',
            'description' => 'Produto utilizado em testes.',
            'category_id' => $category->id,
            'brand' => 'Velmora',
            'characteristics_id' => $characteristic->id,
            'price' => 199.90,
            'stock' => 10,
            'active' => true,
        ], $attributes));
    }

    private function createCartItem(Product $product): CartItem
    {
        $cart = Cart::create([
            'guest_token' => (string) Str::uuid(),
        ]);

        return CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ])->load('product');
    }

    public function test_active_product_with_stock_is_available(): void
    {
        $product = $this->createProduct();

        $cartItem = $this->createCartItem($product);

        $resource = (new CartItemResource($cartItem))
            ->resolve(Request::create('/'));

        $this->assertFalse($resource['unavailable']);
    }

    public function test_inactive_product_is_unavailable(): void
    {
        $product = $this->createProduct([
            'active' => false,
        ]);

        $cartItem = $this->createCartItem($product);

        $resource = (new CartItemResource($cartItem))
            ->resolve(Request::create('/'));

        $this->assertTrue($resource['unavailable']);
    }

    public function test_product_without_stock_is_unavailable(): void
    {
        $product = $this->createProduct([
            'stock' => 0,
        ]);

        $cartItem = $this->createCartItem($product);

        $resource = (new CartItemResource($cartItem))
            ->resolve(Request::create('/'));

        $this->assertTrue($resource['unavailable']);
    }

    public function test_soft_deleted_product_is_unavailable(): void
    {
        $product = $this->createProduct();

        $cartItem = $this->createCartItem($product);

        $product->delete();

        $cartItem->load('product');

        $resource = (new CartItemResource($cartItem))
            ->resolve(Request::create('/'));

        $this->assertTrue($resource['unavailable']);
    }
}
