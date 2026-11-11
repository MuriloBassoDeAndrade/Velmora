<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Support\Money;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrderSeeder extends Seeder
{
    private const SHIPPING_CENTS = 2990;

    public function run(): void
    {
        DB::transaction(function () {

            // Busca e agrupa os endereços por usuário.
            $addresses = Address::orderBy('id')
                ->get()
                ->groupBy('user_id')
                ->map(fn ($items) => $items->values());

            $orders = [
                [
                    'status' => Order::STATUS_PENDING_PAYMENT,
                    'customer_email' => 'ana@velmora.com',
                    'address_index' => 0,
                    'items' => [
                        ['Casio Duro MDV-106-1A', 1],
                        ['Seiko 5 Sports SRPD55K1', 1],
                    ],
                ],
                [
                    'status' => Order::STATUS_PAID,
                    'customer_email' => 'bruno@velmora.com',
                    'address_index' => 0,
                    'items' => [
                        ['Orient Bambino Version 4 FAC08003A0', 1],
                    ],
                ],
                [
                    'status' => Order::STATUS_SHIPPED,
                    'customer_email' => 'carla@velmora.com',
                    'address_index' => 0,
                    'items' => [
                        ['Tissot PRX Powermatic 80 40 mm T137.407.11.041.00', 1],
                        ['Tissot PRX Powermatic 80 35 mm T137.207.11.041.00', 1],
                    ],
                ],
                [
                    'status' => Order::STATUS_DELIVERED,
                    'customer_email' => 'ana@velmora.com',
                    'address_index' => 1,
                    'items' => [
                        ['Casio Vintage LA680WGA-1B', 1],
                        ['Casio LTP-1183A-7A', 1],
                    ],
                ],
                [
                    'status' => Order::STATUS_CANCELLED,
                    'customer_email' => 'bruno@velmora.com',
                    'address_index' => 0,
                    'items' => [
                        ['Seiko 5 Sports SRPD55K1', 1],
                    ],
                ],
            ];

            foreach ($orders as $data) {

                // Busca o cliente.
                $user = User::where('email', $data['customer_email'])
                    ->firstOrFail();

                // Busca os endereços daquele cliente.
                $userAddresses = $addresses->get($user->id);

                if (!$userAddresses || !$userAddresses->has($data['address_index'])) {
                    continue;
                }

                $address = $userAddresses->get($data['address_index']);

                // Busca os produtos solicitados.
                $productNames = collect($data['items'])
                    ->pluck(0)
                    ->unique()
                    ->values();

                $products = Product::whereIn('name', $productNames)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('name');

                $selectedItems = [];
                $subtotalCents = 0;

                // Valida todos os itens antes de criar o pedido.
                foreach ($data['items'] as [$productName, $quantity]) {

                    $product = $products->get($productName);

                    if (
                        !$product ||
                        !$product->active ||
                        $product->stock < $quantity
                    ) {
                        $selectedItems = [];
                        break;
                    }

                    $unitPriceCents = Money::toCents(
                        (string) $product->price
                    );

                    $selectedItems[] = [
                        'product' => $product,
                        'quantity' => $quantity,
                    ];

                    $subtotalCents += $unitPriceCents * $quantity;
                }

                // Não cria pedidos incompletos.
                if (empty($selectedItems)) {
                    continue;
                }

                $totalCents = $subtotalCents + self::SHIPPING_CENTS;

                // Cria o pedido.
                $order = Order::create([
                    'user_id' => $user->id,
                    'address_id' => $address->id,
                    'status' => $data['status'],
                    'subtotal' => Money::format($subtotalCents),
                    'shipping' => Money::format(self::SHIPPING_CENTS),
                    'total' => Money::format($totalCents),
                ]);

                // Cria os itens e atualiza o estoque.
                foreach ($selectedItems as $item) {

                    $product = $item['product'];
                    $quantity = $item['quantity'];

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

                // Cria pagamento para pedidos pagos.
                if (in_array($data['status'], [
                    Order::STATUS_PAID,
                    Order::STATUS_SHIPPED,
                    Order::STATUS_DELIVERED,
                ], true)) {

                    $hoursAgo = match ($data['status']) {
                        Order::STATUS_PAID => 48,
                        Order::STATUS_SHIPPED => 36,
                        Order::STATUS_DELIVERED => 24,
                    };

                    Payment::create([
                        'order_id' => $order->id,
                        'amount' => Money::format($totalCents),
                        'method' => 'simulated',
                        'paid_at' => now()->subHours($hoursAgo),
                    ]);
                }
            }
        });
    }

}
