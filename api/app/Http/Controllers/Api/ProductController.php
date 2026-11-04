<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Services\ProductService;

class ProductController extends Controller
{
    public function __construct(
        private ProductService $ProductService
    ) {}

    public function index()
    {
        $products = $this->ProductService->listAll();

        return ProductResource::collection($products);
    }

    public function store(StoreProductRequest $request)
    {
        $product = $this->ProductService->create($request->validated());

        return new ProductResource($product);
    }

    public function show(int $id)
    {
        $product = $this->ProductService->findById($id);

        return new ProductResource($product);
    }

    public function update(UpdateProductRequest $request, int $id)
    {
        $product = $this->ProductService->update($id, $request->validated());

        return new ProductResource($product);
    }

    public function destroy(int $id)
    {
        $this->ProductService->delete($id);

        return response()->noContent();
    }
}