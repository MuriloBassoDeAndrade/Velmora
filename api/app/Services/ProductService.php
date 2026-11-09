<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductService
{
    public function getAll(array $filters = []): LengthAwarePaginator
    {
        $query = Product::query()
            ->with(['category', 'characteristics'])
            ->where('active', true);

        if (!empty($filters['search'])) {
            $query->where('name', 'LIKE', '%' . $filters['search'] . '%');
        }

        if (!empty($filters['category'])) {
            $query->whereHas('category', function ($categoryQuery) use ($filters) {
                $categoryQuery->where('slug', $filters['category']);
            });
        }
        $sort = $filters['sort'] ?? 'name';

        switch ($sort) {
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;

            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;

            case 'recent':
                $query->orderBy('created_at', 'desc');
                break;

            default:
                $query->orderBy('name', 'asc');
                break;
}
        return $query
            ->paginate(12)
            ->withQueryString();
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

    $product->delete();
    }
}