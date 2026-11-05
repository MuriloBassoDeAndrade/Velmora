<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    private const SHIPPING = 29.90;

    public function run(): void
    {
        $addresses = Address::orderBy('id')->get()->groupBy('user_id');
        $products = Product::where('active', true)->where('stock', '>', 0)->orderBy('id')->get();
        if ($addresses->isEmpty() || $products->count() < 3) {
            return;
        }

        $orders = [
            ['status' => Order::STATUS_PENDING_PAYMENT, 'customer_email' => 'ana@velmora.com', 'address_index' => 0, 'items' => [[2, 1], [3, 2]]],
            ['status' => Order::STATUS_PAID, 'customer_email' => 'bruno@velmora.com', 'address_index' => 0, 'items' => [[4, 1], [5, 1]]],
            ['status' => Order::STATUS_SHIPPED, 'customer_email' => 'carla@velmora.com', 'address_index' => 0, 'items' => [[6, 2], [7, 1], [9, 1]]],
            ['status' => Order::STATUS_DELIVERED, 'customer_email' => 'ana@velmora.com', 'address_index' => 1, 'items' => [[8, 1], [10, 1]]],
            ['status' => Order::STATUS_CANCELLED, 'customer_email' => 'bruno@velmora.com', 'address_index' => 0, 'items' => [[11, 1], [12, 1]]],
        ];

        foreach ($orders as $data) {
            $user = \App\Models\User::where('email', $data['customer_email'])->firstOrFail();
            $userAddresses = $addresses->get($user->id);
            if (!$userAddresses || !isset($userAddresses[$data['address_index']])) {
                continue;
            }
            $address = $userAddresses[$data['address_index']];

            $selectedItems = [];
            $subtotal = 0.0;
            foreach ($data['items'] as [$productId, $quantity]) {
                $product = Product::find($productId);
                if (!$product || !$product->active || $product->stock < $quantity) {
                    continue;
                }
                $selectedItems[] = [$product, $quantity];
                $subtotal += (float) $product->price * $quantity;
            }
            if ($selectedItems === []) {
                continue;
            }

            $subtotal = round($subtotal, 2);
            $total = round($subtotal + self::SHIPPING, 2);
            $order = Order::create([
                'user_id' => $user->id,
                'address_id' => $address->id,
                'status' => $data['status'],
                'subtotal' => $subtotal,
                'shipping' => self::SHIPPING,
                'total' => $total,
            ]);

            foreach ($selectedItems as [$product, $quantity]) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'unit_price' => $product->price,
                    'quantity' => $quantity,
                ]);

                if ($data['status'] !== Order::STATUS_CANCELLED) {
                    $product->decrement('stock', $quantity);
                }
            }

            if (in_array($data['status'], [Order::STATUS_PAID, Order::STATUS_SHIPPED, Order::STATUS_DELIVERED], true)) {
                Payment::create([
                    'order_id' => $order->id,
                    'amount' => $total,
                    'method' => 'simulated',
                    'paid_at' => now()->subHours(match ($data['status']) {
                        Order::STATUS_PAID => 48,
                        Order::STATUS_SHIPPED => 36,
                        Order::STATUS_DELIVERED => 24,
                    }),
                ]);
            }
        }
    }
}
