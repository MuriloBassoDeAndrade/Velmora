<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
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
            // Escapa % e _ (curingas do LIKE) para a busca ser literal.
            // O caractere de escape "!" funciona igual no MySQL e no SQLite.
            $term = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], (string) $filters['search']);

            $query->whereRaw("name LIKE ? ESCAPE '!'", ['%' . $term . '%']);
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
                $query->orderByDesc('id');
                break;

            default:
                $query->orderBy('name', 'asc');
                break;
}
        return $query
            ->paginate(12)
            ->withQueryString();
    }

    public function getAllAdmin(): LengthAwarePaginator
    {
        return Product::query()
        ->with(['category', 'characteristics'])
        ->orderBy('name')
        ->paginate(12)
        ->withQueryString();
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

    /**
     * Define o estoque de um produto (inclusive inativo). Usa lock para não
     * competir com um pedido sendo criado ao mesmo tempo.
     */
    public function updateStock(int $id, int $stock): Product
    {
        return DB::transaction(function () use ($id, $stock) {
            $product = Product::query()
                ->whereKey($id)
                ->lockForUpdate()
                ->firstOrFail();

            $product->update(['stock' => $stock]);

            return $product->load(['category', 'characteristics']);
        }, 3);
    }
}
