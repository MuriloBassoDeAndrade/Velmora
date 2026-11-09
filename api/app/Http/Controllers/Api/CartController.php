<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CartService;
use Illuminate\Http\Request;
use App\Http\Resources\CartResource;
use App\Http\Requests\StoreCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;


class CartController extends Controller
{
    public function __construct(
        protected CartService $cartService
    ) {}

    public function index(Request $request)
    {
        if ($request->user()) {
            $cart = $this->cartService->getOrCreateUserCart($request->user());
        } else {
            $guestToken = $request->header('X-Guest-Token');
            $cart = $this->cartService->getOrCreateGuestCart($guestToken);
        }

        $cart = $this->cartService->getCart($cart);

        $response = (new CartResource($cart))->response();
        $response->setStatusCode(200);

        if (!$request->user()) {
            $response->headers->set('X-Guest-Token', $cart->guest_token);
        }

        return $response;
    }

    public function store(StoreCartItemRequest $request)
    {
        if ($request->user()) {
            $cart = $this->cartService->getOrCreateUserCart($request->user());
        } else {
            $guestToken = $request->header('X-Guest-Token');
            $cart = $this->cartService->getOrCreateGuestCart($guestToken);
        }

        $validated = $request->validated();

        $this->cartService->addItem(
            $cart,
            $validated['product_id'],
            $validated['quantity']
        );

        $cart = $this->cartService->getCart($cart);

        $response = (new CartResource($cart))->response();
        $response->setStatusCode(200);

        if (!$request->user()) {
            $response->headers->set('X-Guest-Token', $cart->guest_token);
        }

        return $response;
    }

    public function update(UpdateCartItemRequest $request, int $id)
    {
        if ($request->user()) {
            $cart = $this->cartService->getOrCreateUserCart($request->user());
        } else {
            $guestToken = $request->header('X-Guest-Token');
            $cart = $this->cartService->getOrCreateGuestCart($guestToken);
        }

        $validated = $request->validated();

        $this->cartService->updateItem(
            $cart,
            $id,
            $validated['quantity']
        );

        $cart = $this->cartService->getCart($cart);

        $response = (new CartResource($cart))->response();

        if (!$request->user()) {
            $response->headers->set('X-Guest-Token', $cart->guest_token);
        }

        return $response;
    }

    public function destroy(Request $request, int $id)
    {
        if ($request->user()) {
            $cart = $this->cartService->getOrCreateUserCart($request->user());
        } else {
            $guestToken = $request->header('X-Guest-Token');
            $cart = $this->cartService->getOrCreateGuestCart($guestToken);
        }

        $this->cartService->removeItem($cart, $id);

        $cart = $this->cartService->getCart($cart);

        $response = (new CartResource($cart))->response();

        if (!$request->user()) {
            $response->headers->set('X-Guest-Token', $cart->guest_token);
        }

        return $response;
    }

    public function merge(Request $request)
    {
        $guestToken = $request->header('X-Guest-Token');

        if (!$guestToken) {
            return response()->json([
                'message' => 'Guest token is required.',
            ], 422);
        }

        $guestCart = $this->cartService->getGuestCartByToken($guestToken);

        $result = $this->cartService->mergeCarts(
            $request->user(),
            $guestCart,
            $guestToken
        );

        return response()->json([
            'cart' => new CartResource($result['cart']),
            'adjustments' => $result['adjustments'],
        ]);
    }
}