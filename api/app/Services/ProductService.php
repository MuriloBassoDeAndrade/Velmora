<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class ProductService
{
    public function getAll(): Collection
    {
        return Product::query()
        ->with(['category', 'characteristics'])
        ->where('active', true)
        ->orderBy('name')
        ->get();
    }

    public function getAllAdmin(): Collection
    {
        return Product::query()
        ->with(['category', 'characteristics'])
        ->orderBy('name')
        ->get();
    }

    public function getById(int $id): Product
    {
        return Product::query()
        ->with(['category', 'characteristics'])
        ->where('active', true)
        ->findOrFail($id);
    }

    public function getByIdAdmin(int $id): Product
    {
        return Product::query()
        ->with(['category', 'characteristics'])
        ->findOrFail($id);
    }

    public function create(array $data): Product
{
    $product = Product::query()->create($data);

    return $product->load(['category', 'characteristics']);
}

    public function update(int $id, array $data): Product
    {
        $product = $this->getByIdAdmin($id);
        $product->update($data);
        return $product->load(['category', 'characteristics']);
    }
    
    public function delete(int $id): void
    {
        $product = $this->getByIdAdmin($id);

        if($product->orderItems()->exists())
            {
                throw ValidationException::withMessages([
                'product' => 'Cannot delete a product associated with orders.'
                ]);
            }
        
            $product->delete();    
    }
}