<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesCatalog;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase, CreatesCatalog;

    private function names(string $url): array
    {
        return array_column($this->getJson($url)->assertOk()->json('data'), 'name');
    }

    public function test_search_by_name(): void
    {
        $this->createProduct(['name' => 'Alpha Gold']);
        $this->createProduct(['name' => 'Beta Steel']);
        $this->createProduct(['name' => 'Gamma Gold']);

        $this->assertEqualsCanonicalizing(['Alpha Gold', 'Gamma Gold'], $this->names('/api/products?search=Gold'));
    }

    public function test_search_treats_percent_and_underscore_literally(): void
    {
        $this->createProduct(['name' => 'Relógio 100% Aço']);
        $this->createProduct(['name' => 'Relógio_Sport']);
        $this->createProduct(['name' => 'Relógio Clássico']);

        // "%" não pode virar curinga: só o produto que tem "%" no nome aparece.
        $this->assertSame(['Relógio 100% Aço'], $this->names('/api/products?search=' . urlencode('%')));
        $this->assertSame(['Relógio_Sport'], $this->names('/api/products?search=' . urlencode('_')));
        $this->assertSame(['Relógio_Sport'], $this->names('/api/products?search=' . urlencode('o_S')));
    }

    public function test_empty_search_returns_empty_list(): void
    {
        $this->createProduct(['name' => 'Alpha']);

        $this->getJson('/api/products?search=zzz')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_filter_by_category_slug(): void
    {
        $luxo = $this->createCategory(['name' => 'Luxo', 'slug' => 'luxo']);
        $this->createProduct(['name' => 'Alpha', 'category_id' => $luxo->id]);
        $this->createProduct(['name' => 'Beta']);

        $this->assertSame(['Alpha'], $this->names('/api/products?category=luxo'));
    }

    public function test_filter_by_gender(): void
    {
        $masculino = $this->createCharacteristic(['gender' => 'Masculino']);
        $feminino = $this->createCharacteristic(['gender' => 'Feminino']);
        $unissex = $this->createCharacteristic(['gender' => 'Unissex']);
        $this->createProduct(['name' => 'Relógio masculino', 'characteristics_id' => $masculino->id]);
        $this->createProduct(['name' => 'Relógio feminino', 'characteristics_id' => $feminino->id]);
        $this->createProduct(['name' => 'Relógio unissex', 'characteristics_id' => $unissex->id]);

        $this->assertEqualsCanonicalizing(
            ['Relógio masculino', 'Relógio unissex'],
            $this->names('/api/products?gender=Masculino')
        );
        $this->assertEqualsCanonicalizing(
            ['Relógio feminino', 'Relógio unissex'],
            $this->names('/api/products?gender=Feminino')
        );
    }

    public function test_sort_by_price_both_directions(): void
    {
        $this->createProduct(['name' => 'Caro', 'price' => 500]);
        $this->createProduct(['name' => 'Barato', 'price' => 100]);
        $this->createProduct(['name' => 'Medio', 'price' => 300]);

        $this->assertSame(['Barato', 'Medio', 'Caro'], $this->names('/api/products?sort=price_asc'));
        $this->assertSame(['Caro', 'Medio', 'Barato'], $this->names('/api/products?sort=price_desc'));
    }

    public function test_recent_sort_is_deterministic_even_with_same_created_at(): void
    {
        $now = now();
        $first = $this->createProduct(['name' => 'Primeiro']);
        $second = $this->createProduct(['name' => 'Segundo']);
        $third = $this->createProduct(['name' => 'Terceiro']);

        foreach ([$first, $second, $third] as $product) {
            $product->forceFill(['created_at' => $now])->saveQuietly();
        }

        $this->assertSame(['Terceiro', 'Segundo', 'Primeiro'], $this->names('/api/products?sort=recent'));
    }

    public function test_listing_is_paginated(): void
    {
        for ($i = 0; $i < 15; $i++) {
            $this->createProduct();
        }

        $page1 = $this->getJson('/api/products')->assertOk();
        $this->assertCount(12, $page1->json('data'));
        $this->assertArrayHasKey('meta', $page1->json());

        $this->getJson('/api/products?page=2')->assertOk()->assertJsonCount(3, 'data');
    }
}
