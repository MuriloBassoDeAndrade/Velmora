<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\CreatesCatalog;
use Tests\TestCase;

class CartTotalsTest extends TestCase
{
    use RefreshDatabase, CreatesCatalog;

    public function test_totals_are_exact_and_computed_by_the_server(): void
    {
        $a = $this->createProduct(['price' => '0.10', 'stock' => 10]);
        $b = $this->createProduct(['price' => '19.99', 'stock' => 10]);

        $first = $this->postJson('/api/cart/items', ['product_id' => $a->id, 'quantity' => 3])->assertOk();
        $token = $first->headers->get('X-Guest-Token');

        $response = $this->withHeader('X-Guest-Token', $token)
            ->postJson('/api/cart/items', ['product_id' => $b->id, 'quantity' => 3])
            ->assertOk();

        $response->assertJsonPath('data.items.0.subtotal', '0.30')
            ->assertJsonPath('data.items.1.subtotal', '59.97')
            ->assertJsonPath('data.total', '60.27');
    }

    public function test_unavailable_items_are_flagged_and_left_out_of_total(): void
    {
        $user = $this->createCustomer();
        $ok = $this->createProduct(['price' => '10.00', 'stock' => 5]);
        $inactive = $this->createProduct(['price' => '50.00', 'stock' => 5]);
        $soldOut = $this->createProduct(['price' => '70.00', 'stock' => 5]);

        $this->addToCart($user, $ok, 2);
        $this->addToCart($user, $inactive, 1);
        $this->addToCart($user, $soldOut, 1);

        $inactive->update(['active' => false]);
        $soldOut->update(['stock' => 0]);

        $response = $this->actingAs($user)->getJson('/api/cart')->assertOk();

        $response->assertJsonPath('data.total', '20.00')
            ->assertJsonPath('data.has_unavailable_items', true)
            ->assertJsonPath('data.items.0.unavailable', false)
            ->assertJsonPath('data.items.1.unavailable', true)
            ->assertJsonPath('data.items.1.subtotal', '0.00')
            ->assertJsonPath('data.items.2.unavailable', true);
    }

    public function test_item_above_current_stock_is_flagged(): void
    {
        $user = $this->createCustomer();
        $product = $this->createProduct(['price' => '10.00', 'stock' => 5]);
        $this->addToCart($user, $product, 4);

        // O estoque cai depois de o item entrar no carrinho.
        $product->update(['stock' => 2]);

        $this->actingAs($user)->getJson('/api/cart')
            ->assertOk()
            ->assertJsonPath('data.items.0.exceeds_stock', true)
            ->assertJsonPath('data.items.0.unavailable', false)
            ->assertJsonPath('data.has_items_exceeding_stock', true);
    }

    public function test_item_within_stock_is_not_flagged(): void
    {
        $user = $this->createCustomer();
        $product = $this->createProduct(['stock' => 5]);
        $this->addToCart($user, $product, 5);

        $this->actingAs($user)->getJson('/api/cart')
            ->assertOk()
            ->assertJsonPath('data.items.0.exceeds_stock', false)
            ->assertJsonPath('data.has_items_exceeding_stock', false);
    }

    public function test_bearer_user_gets_the_account_cart_not_a_guest_cart(): void
    {
        $user = $this->createCustomer();
        $token = $user->createToken('t')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/cart')->assertOk();

        $this->assertSame($user->id, $response->json('data.user_id'));
        $this->assertNull($response->headers->get('X-Guest-Token'));
    }

    public function test_unknown_guest_token_is_replaced_by_one_generated_by_the_api(): void
    {
        $forged = '22222222-2222-4222-8222-222222222222';

        $response = $this->withHeader('X-Guest-Token', $forged)->getJson('/api/cart')->assertOk();

        $this->assertNotSame($forged, $response->headers->get('X-Guest-Token'));
        $this->assertDatabaseMissing('carts', ['guest_token' => $forged]);
    }

    public function test_merge_endpoint_uses_the_same_data_wrapper_as_other_cart_routes(): void
    {
        $user = $this->createCustomer();
        $product = $this->createProduct(['stock' => 3]);
        $token = (string) Str::uuid();
        Cart::create(['guest_token' => $token])
            ->items()->create(['product_id' => $product->id, 'quantity' => 2]);

        $this->actingAs($user)->withHeader('X-Guest-Token', $token)
            ->postJson('/api/cart/merge')
            ->assertOk()
            ->assertJsonStructure(['data' => ['id', 'items', 'total'], 'adjustments'])
            ->assertJsonPath('data.items.0.quantity', 2);
    }
}
