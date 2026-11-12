<?php

namespace Tests\Concerns;

use App\Models\Address;
use App\Models\Cart;
use App\Models\Category;
use App\Models\Characteristic;
use App\Models\Product;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

trait CreatesCatalog
{
    protected function characteristicData(array $overrides = []): array
    {
        return array_merge([
            'gender' => 'Masculino',
            'case_shape' => 'Redondo',
            'movement_type' => 'Automático',
            'module_caliber_movement_number' => 'NH35A',
            'size_perception' => 'Médio',
            'case_material' => 'Aço inoxidável',
            'main_watch_color' => 'Prata',
            'strap_color' => 'Prata',
            'dial_color' => 'Azul',
            'strap_type' => 'Aço',
            'dial_style' => 'Analógico',
            'crystal_type' => 'Safira',
            'crown_and_caseback_type' => 'Rosqueada',
            'functions' => 'Horas, minutos, segundos, data',
            'water_resistance' => '100 m',
            'warranty' => '1 ano',
            'illumination_type' => 'Lume',
            'watch_dimensions' => '40 mm',
            'dial_dimensions' => '32 mm',
            'thickness' => '12 mm',
            'weight' => '150 g',
            'strap_lug_width' => '20 mm',
        ], $overrides);
    }

    protected function createCharacteristic(array $overrides = []): Characteristic
    {
        return Characteristic::query()->create($this->characteristicData($overrides));
    }

    protected function createCategory(array $overrides = []): Category
    {
        static $counter = 0;
        $counter++;

        return Category::query()->create(array_merge([
            'name' => "Categoria {$counter}",
            'slug' => "categoria-{$counter}",
        ], $overrides));
    }

    protected function createProduct(array $overrides = []): Product
    {
        static $counter = 0;
        $counter++;

        return Product::query()->create(array_merge([
            'name' => "Relógio {$counter}",
            'description' => 'Descrição do relógio',
            'brand' => 'Velmora',
            'price' => 999.90,
            'stock' => 5,
            'image_url' => null,
            'active' => true,
            'category_id' => $overrides['category_id'] ?? $this->createCategory()->id,
            'characteristics_id' => $overrides['characteristics_id'] ?? $this->createCharacteristic()->id,
        ], $overrides));
    }

    protected function createAdmin(): User
    {
        $admin = User::factory()->create();
        $admin->role = 'admin';
        $admin->save();

        return $admin;
    }

    protected function actingAsAdmin(): User
    {
        $admin = $this->createAdmin();
        Sanctum::actingAs($admin);

        return $admin;
    }

    protected function actingAsCustomer(): User
    {
        $customer = User::factory()->create();
        Sanctum::actingAs($customer);

        return $customer;
    }

    protected function createAddress(User $user, array $overrides = []): Address
    {
        return $user->addresses()->create(array_merge([
            'recipient_name' => 'Cliente Teste',
            'street' => 'Rua das Flores',
            'number' => '100',
            'complement' => null,
            'neighborhood' => 'Centro',
            'city' => 'Guarapuava',
            'state' => 'PR',
            'cep' => '85010-000',
        ], $overrides));
    }

    protected function addToCart(User $user, Product $product, int $quantity): void
    {
        $cart = Cart::query()->firstOrCreate(['user_id' => $user->id]);
        $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => $quantity,
        ]);
    }

    protected function createCustomer(): User
    {
        return User::factory()->create();
    }


    protected function fromFrontend(): static
    {
        return $this->withHeader('Referer', 'http://localhost');
    }
}
