<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class CategoryService 
{
    public function getAll(): Collection
    {
        return Category::query()
        ->orderBy('name')
        ->get();
        
    }

    public function getById(int $id): Category
    {
        return Category::query()
        ->findOrFail($id);
    }

    public function create(array $data): Category
    {
        return Category::query()
        ->create($data);
    } 

    public function update(int $id, array $data): Category
    {
        $category = $this->getById($id);
        $category->update($data);
        return $category;
    }
    public function delete(int $id): void
    {
        $category = $this->getById($id);

        if($category->products()->withTrashed()->exists())
            {
                throw ValidationException::withMessages([
                'category' => 'Cannot delete category with associated products.'
                ]);
            }
        
            $category->delete(); 
            
    }
}