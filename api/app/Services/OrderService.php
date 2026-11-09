<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Support\Money;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class OrderService
{
    /** Frete fixo de R$ 29,90 (mesmo valor usado pelo OrderSeeder). */
    public const SHIPPING_CENTS = 2990;

    private const PER_PAGE = 10;

    private const STATUSES = [
        Order::STATUS_PENDING_PAYMENT,
        Order::STATUS_PAID,
        Order::STATUS_SHIPPED,
        Order::STATUS_DELIVERED,
        Order::STATUS_CANCELLED,
    ];

    /** Transições válidas de status. Qualquer outra retorna 409. */
    private const TRANSITIONS = [
        Order::STATUS_PENDING_PAYMENT => [Order::STATUS_PAID, Order::STATUS_CANCELLED],
        Order::STATUS_PAID => [Order::STATUS_SHIPPED],
        Order::STATUS_SHIPPED => [Order::STATUS_DELIVERED],
        Order::STATUS_DELIVERED => [],
        Order::STATUS_CANCELLED => [],
    ];

    /**
     * Cria o pedido a partir do carrinho. Tudo em uma transação: se qualquer
     * item falhar, nada é gravado (nem pedido, nem baixa de estoque).
     */
    public function createFromCart(User $user, int $addressId): Order
    {
        return DB::transaction(function () use ($user, $addressId) {

            $address = $user->addresses()->find($addressId);

            if ($address === null) {
                throw ValidationException::withMessages([
                    'address_id' => 'Address not found.',
                ]);
            }

            $cart = Cart::query()
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            // Ordem fixa por produto evita deadlock entre pedidos concorrentes.
            $cartItems = $cart
                ? $cart->items()->orderBy('product_id')->get()
                : collect();

            if ($cartItems->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => 'Cart is empty.',
                ]);
            }

            $lines = [];
            $subtotalCents = 0;

            foreach ($cartItems as $cartItem) {
                $product = Product::withTrashed()
                    ->whereKey($cartItem->product_id)
                    ->lockForUpdate()
                    ->first();

                if ($product === null || $product->trashed() || !$product->active) {
                    $name = $product?->name ?? "#{$cartItem->product_id}";

                    throw ValidationException::withMessages([
                        'items' => "Product \"{$name}\" is unavailable.",
                    ]);
                }

                if ($cartItem->quantity > $product->stock) {
                    throw ValidationException::withMessages([
                        'items' => "Insufficient stock for product \"{$product->name}\" "
                            . "(requested {$cartItem->quantity}, available {$product->stock}).",
                    ]);
                }

                $subtotalCents += Money::multiply($product->price, $cartItem->quantity);
                $lines[] = [$product, $cartItem->quantity];
            }

            $order = Order::query()->create([
                'user_id' => $user->id,
                'address_id' => $address->id,
                'status' => Order::STATUS_PENDING_PAYMENT,
                'subtotal' => Money::format($subtotalCents),
                'shipping' => Money::format(self::SHIPPING_CENTS),
                'total' => Money::format($subtotalCents + self::SHIPPING_CENTS),
            ]);

            foreach ($lines as [$product, $quantity]) {
                // Preço e nome ficam congelados no item do pedido.
                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'unit_price' => $product->price,
                    'quantity' => $quantity,
                ]);

                $product->decrement('stock', $quantity);
            }

            $cart->items()->delete();

            return $order->load(['items', 'address', 'payment']);
        }, 3);
    }

    public function listForUser(User $user): LengthAwarePaginator
    {
        return $user->orders()
            ->with(['items', 'payment'])
            ->orderByDesc('id')
            ->paginate(self::PER_PAGE);
    }

    public function listAll(?string $status = null): LengthAwarePaginator
    {
        if ($status !== null && !in_array($status, self::STATUSES, true)) {
            throw ValidationException::withMessages([
                'status' => 'Invalid status filter.',
            ]);
        }

        return Order::query()
            ->with(['items', 'payment', 'user'])
            ->when($status, fn ($query) => $query->where('status', $status))
            ->orderByDesc('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString();
    }

    /** Dono do pedido ou admin. Outro usuário recebe 403. */
    public function findForUser(User $user, int $id): Order
    {
        $order = Order::query()
            ->with(['items', 'address', 'payment', 'user'])
            ->findOrFail($id);

        $this->authorizeAccess($user, $order);

        return $order;
    }

    /** Pagamento simulado: somente o dono do pedido (nem o admin) paga. */
    public function pay(User $user, int $id): Order
    {
        return DB::transaction(function () use ($user, $id) {
            $order = Order::query()->lockForUpdate()->findOrFail($id);

            if ($order->user_id !== $user->id) {
                throw new AccessDeniedHttpException('Only the order owner can pay it.');
            }

            return $this->transition($order, Order::STATUS_PAID);
        }, 3);
    }

    /** Dono ou admin; só vale enquanto aguarda pagamento e devolve o estoque. */
    public function cancel(User $user, int $id): Order
    {
        return DB::transaction(function () use ($user, $id) {
            $order = Order::query()->lockForUpdate()->findOrFail($id);

            $this->authorizeAccess($user, $order);

            return $this->transition($order, Order::STATUS_CANCELLED);
        }, 3);
    }

    /** Uso do admin: avançar o status respeitando as transições válidas. */
    public function updateStatus(int $id, string $newStatus): Order
    {
        return DB::transaction(function () use ($id, $newStatus) {
            $order = Order::query()->lockForUpdate()->findOrFail($id);

            return $this->transition($order, $newStatus);
        }, 3);
    }

    private function authorizeAccess(User $user, Order $order): void
    {
        if ($order->user_id !== $user->id && !$user->isAdmin()) {
            throw new AccessDeniedHttpException('You cannot access this order.');
        }
    }

    private function transition(Order $order, string $newStatus): Order
    {
        $allowed = self::TRANSITIONS[$order->status] ?? [];

        if (!in_array($newStatus, $allowed, true)) {
            throw new ConflictHttpException(
                "Order cannot change from {$order->status} to {$newStatus}."
            );
        }

        if ($newStatus === Order::STATUS_PAID) {
            Payment::query()->create([
                'order_id' => $order->id,
                'amount' => $order->total,
                'method' => 'simulated',
                'paid_at' => now(),
            ]);
        }

        if ($newStatus === Order::STATUS_CANCELLED) {
            $this->restock($order);
        }

        $order->update(['status' => $newStatus]);

        return $order->load(['items', 'address', 'payment', 'user']);
    }

    private function restock(Order $order): void
    {
        $items = $order->items()->orderBy('product_id')->get();

        foreach ($items as $item) {
            $product = Product::withTrashed()
                ->whereKey($item->product_id)
                ->lockForUpdate()
                ->first();

            $product?->increment('stock', $item->quantity);
        }
    }
}
