<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

/**
 * Autenticação por sessão (cookie) com Laravel Sanctum no modo SPA.
 * O navegador recebe o cookie de sessão; nenhum token é devolvido no corpo.
 */
class AuthService
{
    public function register(array $data): User
    {
        $user = User::query()
            ->create(Arr::only($data, ['name', 'email', 'password']));

        Auth::guard('web')->login($user);

        return $user;
    }

    public function login(array $credentials): ?User
    {
        $guard = Auth::guard('web');

        if (!$guard->attempt(Arr::only($credentials, ['email', 'password']))) {
            return null;
        }

        return $guard->user();
    }

    public function logout(Request $request): void
    {
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
    }
}
