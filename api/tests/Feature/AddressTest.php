<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesCatalog;
use Tests\TestCase;

class AddressTest extends TestCase
{
    use RefreshDatabase, CreatesCatalog;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'recipient_name' => 'Maria Silva',
            'street' => 'Rua das Flores',
            'number' => '123',
            'complement' => 'Apto 4',
            'neighborhood' => 'Centro',
            'city' => 'Guarapuava',
            'state' => 'pr',
            'cep' => '85010000',
        ], $overrides);
    }

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/addresses')->assertUnauthorized();
        $this->postJson('/api/addresses', $this->payload())->assertUnauthorized();
    }

    public function test_user_can_create_address_and_values_are_normalized(): void
    {
        $user = $this->createCustomer();

        $this->actingAs($user)->postJson('/api/addresses', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.state', 'PR')
            ->assertJsonPath('data.cep', '85010-000');

        $this->assertDatabaseHas('addresses', ['user_id' => $user->id, 'state' => 'PR']);
    }

    public function test_validates_required_fields_and_formats(): void
    {
        $this->actingAs($this->createCustomer())->postJson('/api/addresses', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['recipient_name', 'street', 'number', 'neighborhood', 'city', 'state', 'cep']);

        $this->actingAs($this->createCustomer())
            ->postJson('/api/addresses', $this->payload(['cep' => '123', 'state' => 'PRR']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['cep', 'state']);
    }

    public function test_user_only_lists_own_addresses(): void
    {
        $user = $this->createCustomer();
        $other = $this->createCustomer();
        $mine = $this->createAddress($user);
        $this->createAddress($other);

        $response = $this->actingAs($user)->getJson('/api/addresses')->assertOk();

        $this->assertSame([$mine->id], array_column($response->json('data'), 'id'));
    }

    public function test_user_can_update_own_address_partially(): void
    {
        $user = $this->createCustomer();
        $address = $this->createAddress($user);

        $this->actingAs($user)->putJson("/api/addresses/{$address->id}", ['city' => 'Curitiba'])
            ->assertOk()
            ->assertJsonPath('data.city', 'Curitiba')
            ->assertJsonPath('data.street', 'Rua das Flores');
    }

    public function test_user_cannot_touch_someone_elses_address(): void
    {
        $owner = $this->createCustomer();
        $address = $this->createAddress($owner);
        $intruder = $this->createCustomer();

        $this->actingAs($intruder)->putJson("/api/addresses/{$address->id}", ['city' => 'X'])->assertNotFound();
        $this->actingAs($intruder)->deleteJson("/api/addresses/{$address->id}")->assertNotFound();
    }

    public function test_user_can_delete_unused_address(): void
    {
        $user = $this->createCustomer();
        $address = $this->createAddress($user);

        $this->actingAs($user)->deleteJson("/api/addresses/{$address->id}")->assertNoContent();
        $this->assertDatabaseMissing('addresses', ['id' => $address->id]);
    }

    public function test_cannot_delete_address_used_by_an_order(): void
    {
        $user = $this->createCustomer();
        $address = $this->createAddress($user);
        $product = $this->createProduct(['stock' => 5]);
        $this->addToCart($user, $product, 1);

        $this->actingAs($user)->postJson('/api/orders', ['address_id' => $address->id])->assertCreated();

        $this->actingAs($user)->deleteJson("/api/addresses/{$address->id}")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['address']);
    }
}
