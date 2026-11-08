<?php

namespace App\Services;

use App\Models\Characteristic;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class CharacteristicService 
{
    public function getAll(): Collection
    {
        return Characteristic::query()
        ->orderBy('id')
        ->get();
        
    }

    public function getById(int $id): Characteristic
    {
        return Characteristic::query()
        ->findOrFail($id);
    }

    public function create(array $data): Characteristic
    {
        return Characteristic::query()
        ->create($data);
    } 

    public function update(int $id, array $data): Characteristic
    {
        $characteristic = $this->getById($id);
        $characteristic->update($data);
        return $characteristic;
    }
    public function delete(int $id): void
    {
        $characteristic = $this->getById($id);

        if($characteristic->products()->withTrashed()->exists())
            {
                throw ValidationException::withMessages([
                'characteristic' => 'Cannot delete characteristic with associated products.'
                ]);
            }
        
            $characteristic->delete(); 
            
    }
}