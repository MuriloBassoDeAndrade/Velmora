<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesCatalog;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase, CreatesCatalog;

    public function test_index_is_public_and_ordered_by_name(): void
    {
        $this->createCategory(['name' => 'Luxo', 'slug' => 'luxo']);
        $this->createCategory(['name' => 'Esporte', 'slug' => 'esporte']);

        $response = $this->getJson('/api/categories')->assertOk();

        $this->assertSame(['Esporte', 'Luxo'], array_column($response->json('data'), 'name'));
    }

    public function test_show_returns_category_and_404_when_missing(): void
    {
        $category = $this->createCategory();

        $this->getJson("/api/categories/{$category->id}")
            ->assertOk()
            ->assertJsonPath('data.slug', $category->slug);

        $this->getJson('/api/categories/9999')->assertNotFound();
    }

    public function test_store_requires_authentication(): void
    {
        $this->postJson('/api/categories', ['name' => 'Luxo', 'slug' => 'luxo'])
            ->assertUnauthorized();
    }

    public function test_store_is_forbidden_for_customer(): void
    {
        $this->actingAsCustomer();

        $this->postJson('/api/categories', ['name' => 'Luxo', 'slug' => 'luxo'])
            ->assertForbidden();

        $this->assertDatabaseCount('categories', 0);
    }

    public function test_admin_can_create_category(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/categories', ['name' => 'Luxo', 'slug' => 'luxo'])
            ->assertSuccessful()
            ->assertJsonPath('data.slug', 'luxo');

        $this->assertDatabaseHas('categories', ['slug' => 'luxo']);
    }

    public function test_store_validates_payload_and_unique_slug(): void
    {
        $this->actingAsAdmin();
        $this->createCategory(['slug' => 'luxo']);

        $this->postJson('/api/categories', [])
            ->assertStatus(422)->assertJsonValidationErrors(['name', 'slug']);

        $this->postJson('/api/categories', ['name' => 'Outra', 'slug' => 'luxo'])
            ->assertStatus(422)->assertJsonValidationErrors(['slug']);
    }

    public function test_admin_can_update_category_keeping_own_slug(): void
    {
        $this->actingAsAdmin();
        $category = $this->createCategory(['name' => 'Luxo', 'slug' => 'luxo']);

        $this->putJson("/api/categories/{$category->id}", ['name' => 'Luxo Premium', 'slug' => 'luxo'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Luxo Premium');
    }

    public function test_update_rejects_slug_from_another_category(): void
    {
        $this->actingAsAdmin();
        $this->createCategory(['slug' => 'luxo']);
        $other = $this->createCategory(['slug' => 'esporte']);

        $this->putJson("/api/categories/{$other->id}", ['name' => 'Esporte', 'slug' => 'luxo'])
            ->assertStatus(422)->assertJsonValidationErrors(['slug']);
    }

    public function test_update_is_forbidden_for_customer(): void
    {
        $this->actingAsCustomer();
        $category = $this->createCategory();

        $this->putJson("/api/categories/{$category->id}", ['name' => 'X', 'slug' => 'x'])
            ->assertForbidden();
    }

    public function test_admin_can_delete_empty_category(): void
    {
        $this->actingAsAdmin();
        $category = $this->createCategory();

        $this->deleteJson("/api/categories/{$category->id}")->assertNoContent();
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_cannot_delete_category_with_products(): void
    {
        $this->actingAsAdmin();
        $category = $this->createCategory();
        $this->createProduct(['category_id' => $category->id]);

        $this->deleteJson("/api/categories/{$category->id}")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['category']);

        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }

    public function test_cannot_delete_category_with_soft_deleted_products(): void
    {
        $this->actingAsAdmin();
        $category = $this->createCategory();
        $this->createProduct(['category_id' => $category->id])->delete();

        $this->deleteJson("/api/categories/{$category->id}")->assertStatus(422);
    }
}
