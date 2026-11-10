<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Arr;

class UserService
{
    public function updateProfile(User $user, array $data): User
    {
        $user->update(Arr::except($data, ['current_password']));

        return $user->refresh();
    }
}
