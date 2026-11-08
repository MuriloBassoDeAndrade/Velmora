<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;

class AuthService
{

    public function register(array $data): array
    {
       $user = User::query()
       ->create(Arr::only($data, ['name', 'email', 'password']));
       
       return $this->generateAuthResponse($user);
    }

    public function login(array $credentials): ?array
    {

        $user = User::query()
        ->where('email', $credentials['email'])
        ->first();

        if ($user === null) {
            return null;
        }

        if(!Hash::check($credentials['password'], $user->password)) {
            return null;
        }
        return $this->generateAuthResponse($user);
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    private function generateAuthResponse(User $user): array
    {
         $token = $user->createToken('auth_token')->plainTextToken;
         return [
            'token' => $token,
            'user' => $user,
         ];
     }
     

}