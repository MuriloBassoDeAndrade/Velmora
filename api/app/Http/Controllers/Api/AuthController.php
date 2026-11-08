<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private AuthService $authService) {}

    public function register(RegisterRequest $request) 
    {
        return response()->json(
            $this->authService->register($request->validated()),
            201
        );
    }

    public function login(LoginRequest $request)
    {
        $authData = $this->authService->login($request->validated());
        if($authData === null)
        {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        return response()->json($authData, 200);
    }

    public function logout(request $request)
    {
        $this->authService->logout($request->user());
        return response()->json([
            'message' => 'Logged out successfully'],200);
    }

    public function me(Request $request)
    {
        return response()->json($request->user(), 200);
    }

}

