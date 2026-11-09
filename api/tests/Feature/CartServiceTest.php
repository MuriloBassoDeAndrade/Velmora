<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Category;
use App\Models\Characteristic;
use App\Models\Product;
use App\Models\User;
use App\Services\CartService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;


class CartServiceTest extends TestCase
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

    private function createGuestCart(): Cart
    {
        return Cart::create([
            'guest_token' => (string) Str::uuid(),
        ]);
    }

    private function createUser(): User
    {
        return User::create([
            'name' => 'Usuário de teste',
            'email' => 'teste@velmora.com',
            'password' => Hash::make('password'),
        ]);
    }

    public function test_it_adds_a_product_to_the_cart(): void
    {
        $product = $this->createProduct();
        $cart = $this->createGuestCart();

        $cartItem = app(CartService::class)->addItem($cart,$product->id,2);

        $this->assertDatabaseHas('cart_items', [
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $this->assertEquals(2, $cartItem->quantity);
    }

    public function test_it_does_not_add_quantity_greater_than_stock(): void
    {
        $product = $this->createProduct([
            'stock' => 3,
        ]);

        $cart = $this->createGuestCart();

        try {
            app(CartService::class)->addItem($cart, $product->id, 4);

            $this->fail('Expected ValidationException was not thrown.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey(
                'quantity',
                $exception->errors()
            );
        }

        $this->assertDatabaseMissing('cart_items', [
            'cart_id' => $cart->id,
            'product_id' => $product->id,
        ]);
    }

    public function test_it_does_not_add_zero_quantity(): void
    {
        $product = $this->createProduct();
        $cart = $this->createGuestCart();

        $this->expectException(ValidationException::class);

        app(CartService::class)->addItem($cart, $product->id, 0);
    }

    public function test_it_does_not_add_inactive_product(): void
    {
        $product = $this->createProduct([
            'active' => false,
        ]);

        $cart = $this->createGuestCart();

        $this->expectException(ValidationException::class);

        app(CartService::class)->addItem($cart, $product->id, 1);
    }

    public function test_it_does_not_add_soft_deleted_product(): void
    {
        $product = $this->createProduct();
        $product->delete();

        $cart = $this->createGuestCart();

        $this->expectException(ValidationException::class);

        app(CartService::class)->addItem($cart, $product->id, 1);
    }

    public function test_it_updates_cart_item_quantity(): void
    {
        $product = $this->createProduct();
        $cart = $this->createGuestCart();

        $cartItem = $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $updatedItem = app(CartService::class)->updateItem(
            $cart,
            $cartItem->id,
            5
        );

        $this->assertDatabaseHas('cart_items', [
            'id' => $cartItem->id,
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 5,
        ]);

        $this->assertEquals(5, $updatedItem->quantity);
    }

    public function test_it_removes_item_when_updating_with_zero_quantity(): void
    {
        $product = $this->createProduct();
        $cart = $this->createGuestCart();

        $cartItem = $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $result = app(CartService::class)->updateItem(
            $cart,
            $cartItem->id,
            0
        );

        $this->assertNull($result);

        $this->assertDatabaseMissing('cart_items', [
            'id' => $cartItem->id,
        ]);
    }

    public function test_it_does_not_update_item_with_quantity_greater_than_stock(): void
    {
        $product = $this->createProduct([
            'stock' => 3,
        ]);

        $cart = $this->createGuestCart();

        $cartItem = $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        try {
            app(CartService::class)->updateItem(
                $cart,
                $cartItem->id,
                4
            );

            $this->fail('Expected ValidationException was not thrown.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey(
                'quantity',
                $exception->errors()
            );
        }

        $this->assertDatabaseHas('cart_items', [
            'id' => $cartItem->id,
            'quantity' => 2,
        ]);
    }

    public function test_it_does_not_update_item_with_inactive_product(): void
    {
        $product = $this->createProduct([
            'active' => false,
        ]);

        $cart = $this->createGuestCart();

        $cartItem = $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $this->expectException(ValidationException::class);

        app(CartService::class)->updateItem(
            $cart,
            $cartItem->id,
            3
        );
    }

    public function test_it_does_not_update_item_with_soft_deleted_product(): void
    {
        $product = $this->createProduct();
        $product->delete();

        $cart = $this->createGuestCart();

        $cartItem = $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $this->expectException(ValidationException::class);

        app(CartService::class)->updateItem(
            $cart,
            $cartItem->id,
            3
        );
    }

    public function test_it_removes_item_from_cart(): void
    {
        $product = $this->createProduct();
        $cart = $this->createGuestCart();

        $cartItem = $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        app(CartService::class)->removeItem(
            $cart,
            $cartItem->id
        );

        $this->assertDatabaseMissing('cart_items', [
            'id' => $cartItem->id,
        ]);
    }

    public function test_it_does_not_remove_item_from_another_cart(): void
    {
        $product = $this->createProduct();

        $firstCart = $this->createGuestCart();
        $secondCart = $this->createGuestCart();

        $cartItem = $secondCart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $this->expectException(
            \Illuminate\Database\Eloquent\ModelNotFoundException::class
        );

        app(CartService::class)->removeItem(
            $firstCart,
            $cartItem->id
        );
    }

    public function test_it_does_not_remove_nonexistent_item(): void
    {
        $cart = $this->createGuestCart();

        $this->expectException(
            \Illuminate\Database\Eloquent\ModelNotFoundException::class
        );

        app(CartService::class)->removeItem(
            $cart,
            999999
        );
    }

    public function test_it_merges_guest_cart_into_user_cart(): void
    {
        $user = $this->createUser();
        $product = $this->createProduct();
        $guestCart = $this->createGuestCart();

        $guestCart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $result = app(CartService::class)->mergeCarts(
            $user,
            $guestCart,
            $guestCart->guest_token
        );

        $userCart = $result['cart'];

        $this->assertSame([], $result['adjustments']);

        $this->assertDatabaseHas('cart_items', [
            'cart_id' => $userCart->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $this->assertDatabaseMissing('carts', [
            'id' => $guestCart->id,
        ]);
    }

    public function test_it_sums_quantities_when_merging_same_products(): void
    {
        $user = $this->createUser();
        $product = $this->createProduct();

        $userCart = $user->cart()->create([]);

        $userCart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $guestCart = $this->createGuestCart();

        $guestCart->items()->create([
            'product_id' => $product->id,
            'quantity' => 3,
        ]);

        app(CartService::class)->mergeCarts(
            $user,
            $guestCart,
            $guestCart->guest_token
        );

        $this->assertDatabaseHas('cart_items', [
            'cart_id' => $userCart->id,
            'product_id' => $product->id,
            'quantity' => 5,
        ]);
    }

    public function test_it_does_not_exceed_stock_when_merging_carts(): void
    {
        $user = $this->createUser();

        $product = $this->createProduct([
            'stock' => 4,
        ]);

        $userCart = $user->cart()->create([]);

        $userCart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $guestCart = $this->createGuestCart();

        $guestCart->items()->create([
            'product_id' => $product->id,
            'quantity' => 3,
        ]);

        $result = app(CartService::class)->mergeCarts(
            $user,
            $guestCart,
            $guestCart->guest_token
        );

        $this->assertDatabaseHas('cart_items', [
            'cart_id' => $userCart->id,
            'product_id' => $product->id,
            'quantity' => 4,
        ]);

        $this->assertSame([
            [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'requested_quantity' => 5,
                'final_quantity' => 4,
            ],
        ], $result['adjustments']);
    }

    public function test_it_ignores_inactive_products_when_merging_carts(): void
    {
        $user = $this->createUser();

        $product = $this->createProduct([
            'active' => false,
        ]);

        $guestCart = $this->createGuestCart();

        $guestCart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $result = app(CartService::class)->mergeCarts(
            $user,
            $guestCart,
            $guestCart->guest_token
        );

        $userCart = $result['cart'];

        $this->assertDatabaseMissing('cart_items', [
            'cart_id' => $userCart->id,
            'product_id' => $product->id,
        ]);
    }

    public function test_it_ignores_soft_deleted_products_when_merging_carts(): void
    {
        $user = $this->createUser();

        $product = $this->createProduct();
        $product->delete();

        $guestCart = $this->createGuestCart();

        $guestCart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $result = app(CartService::class)->mergeCarts(
            $user,
            $guestCart,
            $guestCart->guest_token
        );

        $userCart = $result['cart'];

        $this->assertDatabaseMissing('cart_items', [
            'cart_id' => $userCart->id,
            'product_id' => $product->id,
        ]);
    }

    public function test_it_does_not_merge_an_invalid_guest_cart(): void
    {
        $user = $this->createUser();

        $userCart = $user->cart()->create([]);

        $this->expectException(ValidationException::class);

        app(CartService::class)->mergeCarts(
            $user,
            $userCart,
            (string) Str::uuid()
        );
    }

    public function test_it_does_not_merge_carts_with_an_invalid_guest_token(): void
    {
        $user = $this->createUser();
        $guestCart = $this->createGuestCart();

        $this->expectException(ValidationException::class);

        app(CartService::class)->mergeCarts(
            $user,
            $guestCart,
            (string) Str::uuid()
        );
    }
}
