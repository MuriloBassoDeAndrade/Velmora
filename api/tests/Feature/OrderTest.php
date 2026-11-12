<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesCatalog;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase, CreatesCatalog;


    private function pendingOrder(): array
    {
        $user = $this->createCustomer();
        $address = $this->createAddress($user);
        $product = $this->createProduct(['name' => 'Relógio Teste', 'price' => '10.10', 'stock' => 5]);
        $this->addToCart($user, $product, 2);

        $id = $this->actingAs($user)
            ->postJson('/api/orders', ['address_id' => $address->id])
            ->assertCreated()
            ->json('data.id');

        return [$user, Order::query()->findOrFail($id), $product, $address];
    }


    public function test_checkout_requires_authentication(): void
    {
        $this->postJson('/api/orders', ['address_id' => 1])->assertUnauthorized();
    }

    public function test_checkout_creates_order_decrements_stock_and_empties_cart(): void
    {
        [$user, $order, $product] = $this->pendingOrder();

        $this->assertSame(Order::STATUS_PENDING_PAYMENT, $order->status);
        $this->assertSame('20.20', $order->subtotal);
        $this->assertSame('29.90', $order->shipping);
        $this->assertSame('50.10', $order->total);
        $this->assertSame(3, $product->fresh()->stock);
        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_order_item_prices_and_names_are_frozen(): void
    {
        [$user, $order, $product] = $this->pendingOrder();

        $product->update(['name' => 'Nome Novo', 'price' => '999.00']);

        $this->actingAs($user)->getJson("/api/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.items.0.product_name', 'Relógio Teste')
            ->assertJsonPath('data.items.0.unit_price', '10.10')
            ->assertJsonPath('data.items.0.subtotal', '20.20')
            ->assertJsonPath('data.total', '50.10');
    }

    public function test_checkout_with_empty_cart_returns_422(): void
    {
        $user = $this->createCustomer();
        $address = $this->createAddress($user);

        $this->actingAs($user)->postJson('/api/orders', ['address_id' => $address->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['cart']);
    }

    public function test_checkout_requires_an_address_that_belongs_to_the_user(): void
    {
        $user = $this->createCustomer();
        $foreign = $this->createAddress($this->createCustomer());
        $this->addToCart($user, $this->createProduct(['stock' => 3]), 1);

        $this->actingAs($user)->postJson('/api/orders', [])
            ->assertStatus(422)->assertJsonValidationErrors(['address_id']);

        $this->actingAs($user)->postJson('/api/orders', ['address_id' => $foreign->id])
            ->assertStatus(422)->assertJsonValidationErrors(['address_id']);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_insufficient_stock_names_the_product_and_writes_nothing(): void
    {
        $user = $this->createCustomer();
        $address = $this->createAddress($user);
        $fine = $this->createProduct(['name' => 'Produto OK', 'stock' => 5]);
        $short = $this->createProduct(['name' => 'Produto Curto', 'stock' => 5]);

        $this->addToCart($user, $fine, 2);
        $this->addToCart($user, $short, 4);
        $short->update(['stock' => 1]);

        $response = $this->actingAs($user)->postJson('/api/orders', ['address_id' => $address->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['items']);

        $this->assertStringContainsString('Produto Curto', $response->json('errors.items.0'));

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
        $this->assertSame(5, $fine->fresh()->stock);
        $this->assertDatabaseCount('cart_items', 2);
    }

    public function test_inactive_product_blocks_checkout(): void
    {
        $user = $this->createCustomer();
        $address = $this->createAddress($user);
        $product = $this->createProduct(['name' => 'Desativado', 'stock' => 5]);
        $this->addToCart($user, $product, 1);
        $product->update(['active' => false]);

        $response = $this->actingAs($user)->postJson('/api/orders', ['address_id' => $address->id])
            ->assertStatus(422);

        $this->assertStringContainsString('Desativado', $response->json('errors.items.0'));
    }


    public function test_user_lists_only_own_orders(): void
    {
        [$user, $order] = $this->pendingOrder();
        $this->pendingOrder();

        $response = $this->actingAs($user)->getJson('/api/orders')->assertOk();

        $this->assertSame([$order->id], array_column($response->json('data'), 'id'));
    }

    public function test_order_detail_has_items_address_and_status(): void
    {
        [$user, $order] = $this->pendingOrder();

        $this->actingAs($user)->getJson("/api/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.status', 'pending_payment')
            ->assertJsonPath('data.address.city', 'Guarapuava')
            ->assertJsonCount(1, 'data.items');
    }

    public function test_other_customer_cannot_see_the_order_but_admin_can(): void
    {
        [, $order] = $this->pendingOrder();

        $this->actingAs($this->createCustomer())->getJson("/api/orders/{$order->id}")->assertForbidden();
        $this->actingAs($this->createAdmin())->getJson("/api/orders/{$order->id}")->assertOk();
    }

    public function test_missing_order_returns_404(): void
    {
        $this->actingAs($this->createCustomer())->getJson('/api/orders/9999')->assertNotFound();
    }


    public function test_owner_can_pay_and_payment_is_recorded(): void
    {
        [$user, $order] = $this->pendingOrder();

        $this->actingAs($user)->postJson("/api/orders/{$order->id}/pay")
            ->assertOk()
            ->assertJsonPath('data.status', 'paid')
            ->assertJsonPath('data.payment.amount', '50.10')
            ->assertJsonPath('data.payment.method', 'simulated');

        $this->assertNotNull($order->fresh()->payment->paid_at);
    }

    public function test_only_the_owner_can_pay(): void
    {
        [, $order] = $this->pendingOrder();

        $this->actingAs($this->createCustomer())->postJson("/api/orders/{$order->id}/pay")->assertForbidden();
        $this->actingAs($this->createAdmin())->postJson("/api/orders/{$order->id}/pay")->assertForbidden();

        $this->assertSame(Order::STATUS_PENDING_PAYMENT, $order->fresh()->status);
    }

    public function test_paying_twice_returns_409(): void
    {
        [$user, $order] = $this->pendingOrder();

        $this->actingAs($user)->postJson("/api/orders/{$order->id}/pay")->assertOk();
        $this->actingAs($user)->postJson("/api/orders/{$order->id}/pay")->assertStatus(409);

        $this->assertDatabaseCount('payments', 1);
    }


    public function test_owner_cancels_pending_order_and_stock_is_returned(): void
    {
        [$user, $order, $product] = $this->pendingOrder();
        $this->assertSame(3, $product->fresh()->stock);

        $this->actingAs($user)->postJson("/api/orders/{$order->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertSame(5, $product->fresh()->stock);
    }

    public function test_cannot_cancel_a_paid_order(): void
    {
        [$user, $order, $product] = $this->pendingOrder();
        $this->actingAs($user)->postJson("/api/orders/{$order->id}/pay")->assertOk();

        $this->actingAs($user)->postJson("/api/orders/{$order->id}/cancel")->assertStatus(409);

        $this->assertSame(3, $product->fresh()->stock);
    }

    public function test_cannot_cancel_twice_or_stock_would_be_returned_twice(): void
    {
        [$user, $order, $product] = $this->pendingOrder();

        $this->actingAs($user)->postJson("/api/orders/{$order->id}/cancel")->assertOk();
        $this->actingAs($user)->postJson("/api/orders/{$order->id}/cancel")->assertStatus(409);

        $this->assertSame(5, $product->fresh()->stock);
    }

    public function test_other_customer_cannot_cancel_but_admin_can(): void
    {
        [, $order] = $this->pendingOrder();

        $this->actingAs($this->createCustomer())->postJson("/api/orders/{$order->id}/cancel")->assertForbidden();
        $this->actingAs($this->createAdmin())->postJson("/api/orders/{$order->id}/cancel")->assertOk();
    }

    public function test_cancel_returns_stock_even_if_product_was_soft_deleted(): void
    {
        [$user, $order, $product] = $this->pendingOrder();
        $product->delete();

        $this->actingAs($user)->postJson("/api/orders/{$order->id}/cancel")->assertOk();

        $this->assertSame(5, $product->fresh()?->stock ?? \App\Models\Product::withTrashed()->find($product->id)->stock);
    }
    public function test_two_checkouts_cannot_sell_more_than_the_available_stock(): void
    {
        $product = $this->createProduct(['name' => 'Última unidade', 'stock' => 1]);
        $firstUser = $this->createCustomer();
        $secondUser = $this->createCustomer();
        $firstAddress = $this->createAddress($firstUser);
        $secondAddress = $this->createAddress($secondUser);
        $this->addToCart($firstUser, $product, 1);
        $this->addToCart($secondUser, $product, 1);

        $this->actingAs($firstUser)
            ->postJson('/api/orders', ['address_id' => $firstAddress->id])
            ->assertCreated();

        $this->actingAs($secondUser)
            ->postJson('/api/orders', ['address_id' => $secondAddress->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['items']);

        $this->assertSame(0, $product->fresh()->stock);
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('order_items', 1);
    }

}
