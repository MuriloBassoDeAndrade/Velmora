<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CategoryService;
use App\Http\Resources\CategoryResource;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;


class CategoryController extends Controller
{

    private CategoryService $categoryService;

    public function __construct(CategoryService $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    public function index()
    {
     return CategoryResource::collection($this->categoryService->getAll());
    }

    public function store(StoreCategoryRequest $request)
    {
        $data = $request->validated();
        $category = $this->categoryService->create($data);
        return new CategoryResource($category);
    }

    public function show(int $id)
    {
        $category = $this->categoryService->getById($id);
        return new CategoryResource($category);
    }

    public function update(UpdateCategoryRequest $request, int $id)
    {
        $data = $request->validated();
        $category = $this->categoryService->update($id, $data);
        return new CategoryResource($category);
    }

    public function destroy(int $id)
    {
        $this->categoryService->delete($id);
        return response()->noContent();
    }
}
