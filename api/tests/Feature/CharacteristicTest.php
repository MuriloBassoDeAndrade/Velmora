<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesCatalog;
use Tests\TestCase;

class CharacteristicTest extends TestCase
{
    use RefreshDatabase, CreatesCatalog;

    public function test_index_and_show_are_public(): void
    {
        $characteristic = $this->createCharacteristic();

        $this->getJson('/api/characteristics')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson("/api/characteristics/{$characteristic->id}")
            ->assertOk()
            ->assertJsonPath('data.gender', 'Masculino');

        $this->getJson('/api/characteristics/9999')->assertNotFound();
    }

    public function test_store_requires_admin(): void
    {
        $this->postJson('/api/characteristics', $this->characteristicData())->assertUnauthorized();

        $this->actingAsCustomer();
        $this->postJson('/api/characteristics', $this->characteristicData())->assertForbidden();
    }

    public function test_admin_can_create_characteristic(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/characteristics', $this->characteristicData(['gender' => 'Feminino']))
            ->assertCreated()
            ->assertJsonPath('data.gender', 'Feminino');

        $this->assertDatabaseHas('characteristics', ['gender' => 'Feminino']);
    }

    public function test_gender_must_be_one_of_the_supported_values(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/characteristics', $this->characteristicData(['gender' => 'Outro']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['gender']);

        $characteristic = $this->createCharacteristic();
        $this->putJson("/api/characteristics/{$characteristic->id}", ['gender' => 'Outro'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['gender']);
    }

    public function test_store_validates_required_fields(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/characteristics', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['gender', 'case_shape', 'movement_type', 'weight']);
    }

    public function test_admin_can_partially_update_characteristic(): void
    {
        $this->actingAsAdmin();
        $characteristic = $this->createCharacteristic();

        $this->putJson("/api/characteristics/{$characteristic->id}", ['dial_color' => 'Preto'])
            ->assertOk()
            ->assertJsonPath('data.dial_color', 'Preto')
            ->assertJsonPath('data.gender', 'Masculino');
    }

    public function test_update_rejects_empty_value(): void
    {
        $this->actingAsAdmin();
        $characteristic = $this->createCharacteristic();

        $this->putJson("/api/characteristics/{$characteristic->id}", ['gender' => ''])
            ->assertStatus(422)->assertJsonValidationErrors(['gender']);
    }

    public function test_admin_can_delete_unused_characteristic(): void
    {
        $this->actingAsAdmin();
        $characteristic = $this->createCharacteristic();

        $this->deleteJson("/api/characteristics/{$characteristic->id}")->assertNoContent();
        $this->assertDatabaseMissing('characteristics', ['id' => $characteristic->id]);
    }

    public function test_cannot_delete_characteristic_with_products(): void
    {
        $this->actingAsAdmin();
        $characteristic = $this->createCharacteristic();
        $this->createProduct(['characteristics_id' => $characteristic->id]);

        $this->deleteJson("/api/characteristics/{$characteristic->id}")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['characteristic']);
    }
}
