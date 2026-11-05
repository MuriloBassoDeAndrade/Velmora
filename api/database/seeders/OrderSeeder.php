
<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrderSeeder extends Seeder
{
    private const SHIPPING_CENTS = 2990;

    public function run(): void
    {
        DB::transaction(function () {

            // Busca os endereços e agrupa por usuário.
            $addresses = Address::orderBy('id')
                ->get()
                ->groupBy('user_id')
                ->map(fn ($items) => $items->values());

            if ($addresses->isEmpty()) {
                return;
            }

            // Pedidos de demonstração.
            $orders = [
                [
                    'status' => Order::STATUS_PENDING_PAYMENT,
                    'customer_email' => 'ana@velmora.com',
                    'address_index' => 0,
                    'items' => [[2, 1], [3, 2]],
                ],
                [
                    'status' => Order::STATUS_PAID,
                    'customer_email' => 'bruno@velmora.com',
                    'address_index' => 0,
                    'items' => [[4, 1], [5, 1]],
                ],
                [
                    'status' => Order::STATUS_SHIPPED,
                    'customer_email' => 'carla@velmora.com',
                    'address_index' => 0,
                    'items' => [[6, 2], [7, 1], [9, 1]],
                ],
                [
                    'status' => Order::STATUS_DELIVERED,
                    'customer_email' => 'ana@velmora.com',
                    'address_index' => 1,
                    'items' => [[8, 1], [10, 1]],
                ],
                [
                    'status' => Order::STATUS_CANCELLED,
                    'customer_email' => 'bruno@velmora.com',
                    'address_index' => 0,
                    'items' => [[11, 1], [12, 1]],
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

                // Agrupa quantidades de produtos repetidos, se houver.
                $quantities = [];

                foreach ($data['items'] as [$productId, $quantity]) {
                    if ($quantity <= 0) {
                        continue;
                    }

                    $quantities[$productId] = ($quantities[$productId] ?? 0) + $quantity;
                }

                if (empty($quantities)) {
                    continue;
                }

                // Busca os produtos e bloqueia suas linhas durante a transação.
                $products = Product::whereIn('id', array_keys($quantities))
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $selectedItems = [];
                $subtotalCents = 0;

                foreach ($quantities as $productId => $quantity) {

                    $product = $products->get($productId);

                    if (
                        !$product ||
                        !$product->active ||
                        $product->stock < $quantity
                    ) {
                        continue;
                    }

                    $unitPriceCents = $this->moneyToCents((string) $product->price);

                    $selectedItems[] = [
                        'product' => $product,
                        'quantity' => $quantity,
                    ];

                    $subtotalCents += $unitPriceCents * $quantity;
                }

                // Não cria pedidos sem produtos válidos.
                if (empty($selectedItems)) {
                    continue;
                }

                $totalCents = $subtotalCents + self::SHIPPING_CENTS;

                // Cria o pedido.
                $order = Order::create([
                    'user_id' => $user->id,
                    'address_id' => $address->id,
                    'status' => $data['status'],
                    'subtotal' => $this->centsToMoney($subtotalCents),
                    'shipping' => $this->centsToMoney(self::SHIPPING_CENTS),
                    'total' => $this->centsToMoney($totalCents),
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

                    // Pedidos cancelados não consomem estoque.
                    if ($data['status'] !== Order::STATUS_CANCELLED) {
                        $product->decrement('stock', $quantity);
                    }
                }

                // Cria pagamento para pedidos já pagos.
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
                        'amount' => $this->centsToMoney($totalCents),
                        'method' => 'simulated',
                        'paid_at' => now()->subHours($hoursAgo),
                    ]);
                }
            }
        });
    }

    private function moneyToCents(string $value): int
    {
        [$integer, $decimal] = array_pad(explode('.', $value, 2), 2, '0');

        $decimal = str_pad(substr($decimal, 0, 2), 2, '0');

        return ((int) $integer * 100) + (int) $decimal;
    }

    private function centsToMoney(int $cents): string
    {
        return sprintf(
            '%d.%02d',
            intdiv($cents, 100),
            $cents % 100
        );
    }
}
