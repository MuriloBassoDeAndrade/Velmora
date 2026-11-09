<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesCatalog;
use Tests\TestCase;

class AdminStockTest extends TestCase
{
    use RefreshDatabase, CreatesCatalog;

    public function test_requires_admin(): void
    {
        $product = $this->createProduct(['stock' => 5]);

        $this->patchJson("/api/admin/products/{$product->id}/stock", ['stock' => 9])->assertUnauthorized();

        $this->actingAs($this->createCustomer())
            ->patchJson("/api/admin/products/{$product->id}/stock", ['stock' => 9])
            ->assertForbidden();

        $this->assertSame(5, $product->fresh()->stock);
    }

    public function test_admin_updates_stock_and_other_fields_stay_the_same(): void
    {
        $product = $this->createProduct(['name' => 'Intacto', 'stock' => 5]);

        $this->actingAs($this->createAdmin())
            ->patchJson("/api/admin/products/{$product->id}/stock", ['stock' => 42])
            ->assertOk()
            ->assertJsonPath('data.stock', 42)
            ->assertJsonPath('data.name', 'Intacto');

        $this->assertSame(42, $product->fresh()->stock);
    }

    public function test_admin_can_set_stock_to_zero_and_update_inactive_product(): void
    {
        $product = $this->createProduct(['stock' => 5, 'active' => false]);

        $this->actingAs($this->createAdmin())
            ->patchJson("/api/admin/products/{$product->id}/stock", ['stock' => 0])
            ->assertOk()
            ->assertJsonPath('data.stock', 0);
    }

    public function test_validates_stock_value(): void
    {
        $product = $this->createProduct(['stock' => 5]);
        $admin = $this->createAdmin();

        foreach ([[], ['stock' => -1], ['stock' => 'muitos'], ['stock' => 1.5], ['stock' => 2000000]] as $body) {
            $this->actingAs($admin)
                ->patchJson("/api/admin/products/{$product->id}/stock", $body)
                ->assertStatus(422)->assertJsonValidationErrors(['stock']);
        }

        $this->assertSame(5, $product->fresh()->stock);
    }

    public function test_missing_product_returns_404(): void
    {
        $this->actingAs($this->createAdmin())
            ->patchJson('/api/admin/products/9999/stock', ['stock' => 1])
            ->assertNotFound();
    }
}
