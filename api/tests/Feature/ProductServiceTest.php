<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Category;
use App\Models\Characteristic;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\ProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProductServiceTest extends TestCase
{
    use RefreshDatabase;

    private function createProduct(): Product
    {
        $category = Category::create([
            'name' => 'Casual',
            'slug' => 'casual',
        ]);

        $characteristic = Characteristic::create([
            'gender' => 'Masculino',
            'case_shape' => 'Redondo',
            'movement_type' => 'Quartz',
            'module_caliber_movement_number' => '1234',
            'size_perception' => 'Médio',
            'case_material' => 'Aço',
            'main_watch_color' => 'Prata',
            'strap_color' => 'Preto',
            'dial_color' => 'Preto',
            'strap_type' => 'Metal',
            'dial_style' => 'Analógico',
            'crystal_type' => 'Mineral',
            'crown_and_caseback_type' => 'Rosqueada',
            'functions' => 'Horas e minutos',
            'water_resistance' => '50m',
            'warranty' => '1 ano',
            'illumination_type' => 'LED',
            'watch_dimensions' => '40mm',
            'dial_dimensions' => '35mm',
            'thickness' => '10mm',
            'weight' => '100g',
            'strap_lug_width' => '20mm',
        ]);

        return Product::create([
            'name' => 'Relógio de teste',
            'description' => 'Produto utilizado em testes.',
            'category_id' => $category->id,
            'brand' => 'Velmora',
            'characteristics_id' => $characteristic->id,
            'price' => 199.90,
            'stock' => 10,
            'active' => true,
        ]);
    }

    private function createOrderWithProduct(Product $product): OrderItem
    {
        $user = User::create([
            'name' => 'Usuário de teste',
            'email' => 'teste@velmora.com',
            'password' => Hash::make('password'),
        ]);

        $address = Address::create([
            'user_id' => $user->id,
            'recipient_name' => 'Usuário de teste',
            'street' => 'Rua de teste',
            'number' => '123',
            'complement' => null,
            'neighborhood' => 'Centro',
            'city' => 'Guarapuava',
            'state' => 'PR',
            'cep' => '85000-000',
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'address_id' => $address->id,
            'status' => Order::STATUS_PAID,
            'subtotal' => 199.90,
            'shipping' => 29.90,
            'total' => 229.80,
        ]);

        return OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'unit_price' => $product->price,
            'quantity' => 1,
        ]);
    }

    public function test_product_can_be_soft_deleted(): void
    {
        $product = $this->createProduct();

        $service = new ProductService();

        $service->delete($product->id);

        $this->assertSoftDeleted('products', [
            'id' => $product->id,
        ]);
    }

    public function test_product_associated_with_order_can_be_soft_deleted(): void
    {
        $product = $this->createProduct();

        $orderItem = $this->createOrderWithProduct($product);

        $service = new ProductService();

        $service->delete($product->id);

        $this->assertSoftDeleted('products', [
            'id' => $product->id,
        ]);

        $this->assertDatabaseHas('order_items', [
            'id' => $orderItem->id,
            'product_id' => $product->id,
        ]);
    }

    public function test_order_item_can_access_product_after_soft_delete(): void
    {
        $product = $this->createProduct();

        $orderItem = $this->createOrderWithProduct($product);

        $service = new ProductService();

        $service->delete($product->id);

        $orderItem->refresh();

        $this->assertNotNull($orderItem->product);

        $this->assertEquals(
            $product->id,
            $orderItem->product->id
        );

        $this->assertEquals(
            $product->name,
            $orderItem->product->name
        );
    }
}
