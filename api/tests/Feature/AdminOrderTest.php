<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesCatalog;
use Tests\TestCase;

class AdminOrderTest extends TestCase
{
    use RefreshDatabase, CreatesCatalog;

    private function orderWithStatus(string $status, ?int $stock = 5): Order
    {
        $user = $this->createCustomer();
        $address = $this->createAddress($user);
        $product = $this->createProduct(['stock' => $stock]);

        return Order::query()->create([
            'user_id' => $user->id,
            'address_id' => $address->id,
            'status' => $status,
            'subtotal' => '10.00',
            'shipping' => '29.90',
            'total' => '39.90',
        ]);
    }

    public function test_admin_routes_require_admin(): void
    {
        $order = $this->orderWithStatus(Order::STATUS_PAID);

        $this->getJson('/api/admin/orders')->assertUnauthorized();
        $this->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'shipped'])->assertUnauthorized();

        $this->actingAs($this->createCustomer())->getJson('/api/admin/orders')->assertForbidden();
        $this->actingAs($this->createCustomer())
            ->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'shipped'])
            ->assertForbidden();
    }

    public function test_admin_lists_all_orders_and_filters_by_status(): void
    {
        $this->orderWithStatus(Order::STATUS_PENDING_PAYMENT);
        $paid = $this->orderWithStatus(Order::STATUS_PAID);
        $this->orderWithStatus(Order::STATUS_PAID);

        $admin = $this->createAdmin();

        $this->actingAs($admin)->getJson('/api/admin/orders')->assertOk()->assertJsonCount(3, 'data');

        $filtered = $this->actingAs($admin)->getJson('/api/admin/orders?status=paid')->assertOk();
        $this->assertCount(2, $filtered->json('data'));
        $this->assertContains($paid->id, array_column($filtered->json('data'), 'id'));
    }

    public function test_invalid_status_filter_returns_422(): void
    {
        $this->actingAs($this->createAdmin())->getJson('/api/admin/orders?status=banana')
            ->assertStatus(422)->assertJsonValidationErrors(['status']);
    }

    public function test_admin_advances_paid_to_shipped_to_delivered(): void
    {
        $order = $this->orderWithStatus(Order::STATUS_PAID);
        $admin = $this->createAdmin();

        $this->actingAs($admin)->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'shipped'])
            ->assertOk()->assertJsonPath('data.status', 'shipped');

        $this->actingAs($admin)->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'delivered'])
            ->assertOk()->assertJsonPath('data.status', 'delivered');
    }

    public function test_invalid_transitions_return_409(): void
    {
        $admin = $this->createAdmin();

        $pending = $this->orderWithStatus(Order::STATUS_PENDING_PAYMENT);
        $this->actingAs($admin)->patchJson("/api/admin/orders/{$pending->id}/status", ['status' => 'shipped'])
            ->assertStatus(409);

        $paid = $this->orderWithStatus(Order::STATUS_PAID);
        $this->actingAs($admin)->patchJson("/api/admin/orders/{$paid->id}/status", ['status' => 'delivered'])
            ->assertStatus(409);

        $delivered = $this->orderWithStatus(Order::STATUS_DELIVERED);
        $this->actingAs($admin)->patchJson("/api/admin/orders/{$delivered->id}/status", ['status' => 'cancelled'])
            ->assertStatus(409);

        $cancelled = $this->orderWithStatus(Order::STATUS_CANCELLED);
        $this->actingAs($admin)->patchJson("/api/admin/orders/{$cancelled->id}/status", ['status' => 'shipped'])
            ->assertStatus(409);
    }

    public function test_admin_cannot_mark_order_as_paid_through_status_endpoint(): void
    {
        $pending = $this->orderWithStatus(Order::STATUS_PENDING_PAYMENT);

        $this->actingAs($this->createAdmin())
            ->patchJson("/api/admin/orders/{$pending->id}/status", ['status' => 'paid'])
            ->assertStatus(422)->assertJsonValidationErrors(['status']);

        $this->assertDatabaseCount('payments', 0);
    }

    public function test_status_is_required_and_order_must_exist(): void
    {
        $admin = $this->createAdmin();
        $order = $this->orderWithStatus(Order::STATUS_PAID);

        $this->actingAs($admin)->patchJson("/api/admin/orders/{$order->id}/status", [])
            ->assertStatus(422)->assertJsonValidationErrors(['status']);

        $this->actingAs($admin)->patchJson('/api/admin/orders/9999/status', ['status' => 'shipped'])
            ->assertNotFound();
    }
}
