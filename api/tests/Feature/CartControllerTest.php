<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;
use App\Models\Characteristic;
use Illuminate\Support\Facades\Hash;


class CartControllerTest extends TestCase
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

    public function test_guest_can_view_cart(): void
    {
        $response = $this->getJson('/api/cart');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'items',
                ],
            ])
            ->assertHeader('X-Guest-Token');

        $this->assertDatabaseHas('carts', [
            'guest_token' => $response->headers->get('X-Guest-Token'),
        ]);
    }

    public function test_authenticated_user_can_view_cart(): void
    {
        $user = User::create([
            'name' => 'Usuário de teste',
            'email' => 'teste@velmora.com',
            'password' => Hash::make('password'),
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/cart');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'items',
                ],
            ]);

        $this->assertDatabaseHas('carts', [
            'user_id' => $user->id,
        ]);
    }

    public function test_guest_can_add_product_to_cart(): void
    {
        $product = $this->createProduct();

        $response = $this->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response->assertOk()
            ->assertJsonFragment([
                'product_id' => $product->id,
                'quantity' => 2,
            ])
            ->assertHeader('X-Guest-Token');
    }

    public function test_authenticated_user_can_add_product_to_cart(): void
    {
        $user = User::create([
            'name' => 'Usuário de teste',
            'email' => 'teste@velmora.com',
            'password' => Hash::make('password'),
        ]);
        $product = $this->createProduct();

        $response = $this->actingAs($user)
            ->postJson('/api/cart/items', [
                'product_id' => $product->id,
                'quantity' => 2,
            ]);

        $response->assertOk()
            ->assertJsonFragment([
                'product_id' => $product->id,
                'quantity' => 2,
            ]);
    }

    public function test_guest_can_update_cart_item(): void
    {
        $product = $this->createProduct();
        $guestToken = (string) Str::uuid();

        $cart = Cart::create([
            'guest_token' => $guestToken,
        ]);

        $item = $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $response = $this->withHeader('X-Guest-Token', $guestToken)
            ->putJson("/api/cart/items/{$item->id}", [
                'quantity' => 3,
            ]);

        $response->assertOk()
            ->assertJsonFragment([
                'product_id' => $product->id,
                'quantity' => 3,
            ]);
    }

    public function test_guest_can_remove_cart_item(): void
    {
        $product = $this->createProduct();
        $guestToken = (string) Str::uuid();

        $cart = Cart::create([
            'guest_token' => $guestToken,
        ]);

        $item = $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $response = $this->withHeader('X-Guest-Token', $guestToken)
            ->deleteJson("/api/cart/items/{$item->id}");

        $response->assertOk();

        $this->assertDatabaseMissing('cart_items', [
            'id' => $item->id,
        ]);
    }

    public function test_authenticated_user_can_merge_guest_cart(): void
    {
        $user = User::create([
            'name' => 'Usuário de teste',
            'email' => 'teste@velmora.com',
            'password' => Hash::make('password'),
        ]);
        $product = $this->createProduct();
        $guestToken = (string) Str::uuid();

        $guestCart = Cart::create([
            'guest_token' => $guestToken,
        ]);

        $guestCart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($user)
            ->withHeader('X-Guest-Token', $guestToken)
            ->postJson('/api/cart/merge');

        $response->assertOk()
            ->assertJsonStructure([
                'cart',
                'adjustments',
            ]);

        $this->assertDatabaseHas('cart_items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $this->assertDatabaseMissing('carts', [
            'id' => $guestCart->id,
        ]);
    }

    public function test_guest_cannot_merge_cart_without_authentication(): void
    {
        $response = $this->postJson('/api/cart/merge');

        $response->assertUnauthorized();
    }

    public function test_guest_cannot_add_invalid_product(): void
    {
        $response = $this->postJson('/api/cart/items', [
            'product_id' => 999999,
            'quantity' => 1,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['product_id']);
    }

    public function test_guest_cannot_add_zero_quantity(): void
    {
        $product = $this->createProduct();

        $response = $this->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 0,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['quantity']);
    }
}
