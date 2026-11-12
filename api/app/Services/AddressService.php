<?php

namespace App\Services;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class AddressService
{
    public function listForUser(User $user): Collection
    {
        return $user->addresses()->orderBy('id')->get();
    }

    public function create(User $user, array $data): Address
    {
        return $user->addresses()->create($data);
    }

    public function update(User $user, int $id, array $data): Address
    {
        $address = $user->addresses()->findOrFail($id);
        $address->update($data);

        return $address->refresh();
    }

    public function delete(User $user, int $id): void
    {
        $address = $user->addresses()->findOrFail($id);

        if ($address->orders()->exists()) {
            throw ValidationException::withMessages([
                'address' => 'Address is used by an order and cannot be deleted.',
            ]);
        }

        $address->delete();
    }
}
