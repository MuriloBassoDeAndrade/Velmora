<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\CartResource;
use App\Models\User;
use App\Services\AuthService;
use App\Services\CartService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $authService,
        private CartService $cartService,
        private UserService $userService,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        if (!$request->hasSession()) {
            return $this->sessionRequired();
        }

        $user = $this->authService->register($request->validated());
        $request->session()->regenerate();

        return $this->authResponse($request, $user, 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        if (!$request->hasSession()) {
            return $this->sessionRequired();
        }

        $user = $this->authService->login($request->validated());

        if ($user === null) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $request->session()->regenerate();

        return $this->authResponse($request, $user, 200);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request);

        return response()->json(['message' => 'Logged out successfully'], 200);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user(), 200);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->userService->updateProfile(
            $request->user(),
            $request->validated()
        );

        return response()->json($user, 200);
    }

    private function authResponse(Request $request, User $user, int $status): JsonResponse
    {
        $merge = $this->cartService->mergeGuestCartFromToken(
            $user,
            $request->header('X-Guest-Token')
        );

        return response()->json([
            'user' => $user,
            'cart' => $merge ? (new CartResource($merge['cart']))->resolve() : null,
            'adjustments' => $merge['adjustments'] ?? [],
        ], $status);
    }

    private function sessionRequired(): JsonResponse
    {
        return response()->json([
            'message' => 'This request must come from the frontend (Origin/Referer of a stateful domain).',
        ], 400);
    }
}
