<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesCatalog;
use Tests\TestCase;

class ErrorFormatTest extends TestCase
{
    use RefreshDatabase, CreatesCatalog;

    public function test_401_unauthenticated(): void
    {
        $this->getJson('/api/orders')
            ->assertStatus(401)
            ->assertExactJson(['message' => 'Unauthenticated.']);
    }

    public function test_403_forbidden_for_customer_on_admin_route(): void
    {
        $this->actingAs($this->createCustomer())->getJson('/api/admin/orders')
            ->assertStatus(403)
            ->assertJsonStructure(['message'])
            ->assertJsonMissingPath('errors');
    }

    public function test_403_on_someone_elses_order_has_only_message(): void
    {
        $owner = $this->createCustomer();
        $order = Order::query()->create([
            'user_id' => $owner->id,
            'address_id' => $this->createAddress($owner)->id,
            'status' => 'pending_payment',
            'subtotal' => '1.00', 'shipping' => '0.00', 'total' => '1.00',
        ]);

        $this->actingAs($this->createCustomer())->getJson("/api/orders/{$order->id}")
            ->assertStatus(403)
            ->assertJsonStructure(['message'])
            ->assertJsonMissingPath('errors');
    }

    public function test_404_for_missing_model_does_not_leak_model_name(): void
    {
        $response = $this->actingAs($this->createCustomer())->getJson('/api/orders/9999')
            ->assertStatus(404)
            ->assertExactJson(['message' => 'Resource not found.']);

        $this->assertStringNotContainsString('App\\Models', $response->getContent());
    }

    public function test_404_for_unknown_route(): void
    {
        $this->getJson('/api/rota-que-nao-existe')
            ->assertStatus(404)
            ->assertExactJson(['message' => 'Resource not found.']);
    }

    public function test_404_for_missing_public_product(): void
    {
        $this->getJson('/api/products/9999')->assertStatus(404)->assertJsonStructure(['message']);
    }

    public function test_409_conflict_keeps_a_readable_message(): void
    {
        $user = $this->createCustomer();
        $order = Order::query()->create([
            'user_id' => $user->id,
            'address_id' => $this->createAddress($user)->id,
            'status' => 'paid',
            'subtotal' => '1.00', 'shipping' => '0.00', 'total' => '1.00',
        ]);

        $this->actingAs($user)->postJson("/api/orders/{$order->id}/pay")
            ->assertStatus(409)
            ->assertJsonStructure(['message'])
            ->assertJsonMissingPath('errors');
    }

    public function test_422_has_message_and_errors(): void
    {
        $this->actingAs($this->createCustomer())->postJson('/api/orders', [])
            ->assertStatus(422)
            ->assertJsonStructure(['message', 'errors' => ['address_id']]);
    }

    public function test_business_422_uses_the_same_shape(): void
    {
        $user = $this->createCustomer();
        $address = $this->createAddress($user);

        $this->actingAs($user)->postJson('/api/orders', ['address_id' => $address->id])
            ->assertStatus(422)
            ->assertJsonStructure(['message', 'errors' => ['cart']]);
    }
}
