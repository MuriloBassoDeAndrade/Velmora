<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\CreatesCatalog;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase, CreatesCatalog;

    private function productPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Velmora Classic',
            'description' => 'Relógio clássico',
            'brand' => 'Velmora',
            'price' => 1299.90,
            'stock' => 10,
            'active' => true,
            'category_id' => $this->createCategory()->id,
            'characteristics_id' => $this->createCharacteristic()->id,
        ], $overrides);
    }


    public function test_index_lists_only_active_products_ordered_by_name(): void
    {
        $this->createProduct(['name' => 'Zeta', 'active' => true]);
        $this->createProduct(['name' => 'Alfa', 'active' => true]);
        $this->createProduct(['name' => 'Inativo', 'active' => false]);

        $response = $this->getJson('/api/products')->assertOk();

        $this->assertSame(['Alfa', 'Zeta'], array_column($response->json('data'), 'name'));
    }

    public function test_index_includes_category_and_characteristics(): void
    {
        $this->createProduct();

        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonStructure(['data' => [[
                'id', 'name', 'brand', 'price', 'stock', 'active',
                'category' => ['id', 'name', 'slug'],
                'characteristics' => ['id', 'gender', 'movement_type'],
            ]]]);
    }

    public function test_show_returns_active_product(): void
    {
        $product = $this->createProduct(['name' => 'Visível']);

        $this->getJson("/api/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Visível');
    }

    public function test_show_hides_inactive_and_missing_products(): void
    {
        $inactive = $this->createProduct(['active' => false]);

        $this->getJson("/api/products/{$inactive->id}")->assertNotFound();
        $this->getJson('/api/products/9999')->assertNotFound();
    }

    public function test_soft_deleted_product_is_not_listed(): void
    {
        $product = $this->createProduct();
        $product->delete();

        $this->getJson('/api/products')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson("/api/products/{$product->id}")->assertNotFound();
    }


    public function test_admin_index_requires_admin(): void
    {
        $this->getJson('/api/admin/products')->assertUnauthorized();

        $this->actingAsCustomer();
        $this->getJson('/api/admin/products')->assertForbidden();
    }

    public function test_admin_index_includes_inactive_products(): void
    {
        $this->createProduct(['active' => true]);
        $this->createProduct(['active' => false]);
        $this->actingAsAdmin();

        $this->getJson('/api/admin/products')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_admin_show_returns_inactive_product(): void
    {
        $inactive = $this->createProduct(['active' => false]);
        $this->actingAsAdmin();

        $this->getJson("/api/admin/products/{$inactive->id}")
            ->assertOk()
            ->assertJsonPath('data.active', false);
    }


    public function test_store_requires_admin(): void
    {
        $this->postJson('/api/products', $this->productPayload())->assertUnauthorized();

        $this->actingAsCustomer();
        $this->postJson('/api/products', $this->productPayload())->assertForbidden();

        $this->assertDatabaseCount('products', 0);
    }

    public function test_admin_can_create_product(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/products', $this->productPayload())
            ->assertCreated()
            ->assertJsonPath('data.name', 'Velmora Classic')
            ->assertJsonPath('data.price', '1299.90')
            ->assertJsonStructure(['data' => ['category' => ['id'], 'characteristics' => ['id']]]);

        $this->assertDatabaseHas('products', ['name' => 'Velmora Classic', 'stock' => 10]);
    }

    public function test_admin_can_create_product_with_characteristics(): void
    {
        $this->actingAsAdmin();
        $payload = $this->productPayload();
        unset($payload['characteristics_id']);
        $payload['characteristics'] = $this->characteristicData(['gender' => 'Feminino']);

        $this->postJson('/api/products', $payload)
            ->assertCreated()
            ->assertJsonPath('data.characteristics.gender', 'Feminino');

        $this->assertDatabaseHas('characteristics', ['gender' => 'Feminino']);
    }

    public function test_product_characteristics_reject_unsupported_gender(): void
    {
        $this->actingAsAdmin();
        $payload = $this->productPayload();
        unset($payload['characteristics_id']);
        $payload['characteristics'] = $this->characteristicData(['gender' => 'Outro']);

        $this->postJson('/api/products', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['characteristics.gender']);
    }

    public function test_store_validates_required_fields(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/products', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'name', 'brand', 'price', 'stock', 'category_id', 'characteristics_id', 'active',
            ]);
    }

    public function test_store_validates_value_rules(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/products', $this->productPayload([
            'price' => -1,
            'stock' => -5,
            'image_url' => 'https://exemplo.com/relogio.jpg',
            'category_id' => 9999,
            'characteristics_id' => 9999,
        ]))->assertStatus(422)->assertJsonValidationErrors([
            'price', 'stock', 'image_url', 'category_id', 'characteristics_id',
        ]);
    }


    public function test_admin_can_partially_update_product(): void
    {
        $this->actingAsAdmin();
        $product = $this->createProduct(['name' => 'Antigo', 'stock' => 3]);

        $this->putJson("/api/products/{$product->id}", ['name' => 'Novo'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Novo')
            ->assertJsonPath('data.stock', 3);
    }

    public function test_admin_can_update_product_characteristics(): void
    {
        $this->actingAsAdmin();
        $product = $this->createProduct();
        $characteristicId = $product->characteristics_id;

        $this->putJson("/api/products/{$product->id}", [
            'characteristics' => $this->characteristicData(['gender' => 'Feminino']),
        ])->assertOk()->assertJsonPath('data.characteristics.gender', 'Feminino');

        $this->assertDatabaseHas('characteristics', ['id' => $characteristicId, 'gender' => 'Feminino']);
        $this->assertDatabaseCount('characteristics', 1);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'characteristics_id' => $characteristicId]);
    }

    public function test_updating_shared_product_characteristics_creates_a_separate_record(): void
    {
        $this->actingAsAdmin();
        $characteristic = $this->createCharacteristic();
        $product = $this->createProduct(['characteristics_id' => $characteristic->id]);
        $otherProduct = $this->createProduct(['characteristics_id' => $characteristic->id]);

        $response = $this->putJson("/api/products/{$product->id}", [
            'characteristics' => $this->characteristicData(['gender' => 'Feminino']),
        ])->assertOk()->assertJsonPath('data.characteristics.gender', 'Feminino');
        $newCharacteristicId = $response->json('data.characteristics.id');

        $this->assertDatabaseHas('characteristics', ['id' => $characteristic->id, 'gender' => 'Masculino']);
        $this->assertDatabaseHas('products', ['id' => $otherProduct->id, 'characteristics_id' => $characteristic->id]);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'characteristics_id' => $newCharacteristicId]);
        $this->assertNotSame($characteristic->id, $newCharacteristicId);
        $this->assertDatabaseCount('characteristics', 2);
    }

    public function test_admin_can_deactivate_product_and_it_leaves_public_listing(): void
    {
        $this->actingAsAdmin();
        $product = $this->createProduct();

        $this->putJson("/api/products/{$product->id}", ['active' => false])->assertOk();

        $this->getJson('/api/products')->assertJsonCount(0, 'data');
    }

    public function test_update_validates_and_requires_admin(): void
    {
        $product = $this->createProduct();

        $this->putJson("/api/products/{$product->id}", ['name' => 'X'])->assertUnauthorized();

        $this->actingAsCustomer();
        $this->putJson("/api/products/{$product->id}", ['name' => 'X'])->assertForbidden();
    }

    public function test_update_rejects_invalid_values(): void
    {
        $this->actingAsAdmin();
        $product = $this->createProduct();

        $this->putJson("/api/products/{$product->id}", [
            'price' => 'abc',
            'stock' => -1,
            'image_url' => 'https://exemplo.com/relogio.jpg',
        ])->assertStatus(422)->assertJsonValidationErrors(['price', 'stock', 'image_url']);
    }

    public function test_update_missing_product_returns_404(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/products/9999', ['name' => 'X'])->assertNotFound();
    }


    public function test_admin_can_soft_delete_product(): void
    {
        $this->actingAsAdmin();
        $product = $this->createProduct();

        $this->deleteJson("/api/products/{$product->id}")->assertNoContent();

        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    public function test_delete_requires_admin(): void
    {
        $product = $this->createProduct();

        $this->deleteJson("/api/products/{$product->id}")->assertUnauthorized();

        $this->actingAsCustomer();
        $this->deleteJson("/api/products/{$product->id}")->assertForbidden();

        $this->assertDatabaseHas('products', ['id' => $product->id, 'deleted_at' => null]);
    }

    public function test_delete_missing_product_returns_404(): void
    {
        $this->actingAsAdmin();

        $this->deleteJson('/api/products/9999')->assertNotFound();
    }
    public function test_admin_can_upload_product_image_to_public_storage(): void
    {
        Storage::fake('public');
        $this->actingAsAdmin();
        $payload = $this->productPayload([
            'image' => UploadedFile::fake()->create('velmora-watch.jpg', 100, 'image/jpeg'),
        ]);

        $response = $this->post('/api/products', $payload);

        $response->assertCreated();
        $imageUrl = $response->json('data.image_url');
        $path = parse_url($imageUrl, PHP_URL_PATH);
        $storagePath = substr($path, strlen('/storage/'));

        Storage::disk('public')->assertExists($storagePath);
        $this->assertDatabaseHas('products', ['image_url' => $imageUrl]);
    }

}
