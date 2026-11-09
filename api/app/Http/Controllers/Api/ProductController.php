<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProductService;
use App\Http\Resources\ProductResource;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductStockRequest;
use App\Http\Requests\UpdateProductRequest;
use Illuminate\Http\Request;


class ProductController extends Controller
{

    public function __construct(private ProductService $productService) {}

    public function index(Request $request)
    {   
        return ProductResource::collection(
            $this->productService->getAll($request->query())
        );
    }

    public function show(int $id)
    {
        $product = $this->productService->getById($id);
        return new ProductResource($product);
    }

    public function indexAdmin()
    {
        return ProductResource::collection($this->productService->getAllAdmin()
        );
    }

    public function showAdmin(int $id)
    {
        $product = $this->productService->getByIdAdmin($id);

        return new ProductResource($product);
    }

    public function store(StoreProductRequest $request)
    {
        $data = $request->validated();
        $product = $this->productService->create($data);
        return new ProductResource($product)
            ->response()
            ->setStatusCode(201);
    }
    
    public function update(UpdateProductRequest $request, int $id)
    {
        $data = $request->validated();
        $product = $this->productService->update($id, $data);
        return new ProductResource($product);
    }

    public function destroy(int $id)
    {
        $this->productService->delete($id);
        return response()->noContent();
    }

    public function updateStock(UpdateProductStockRequest $request, int $id)
    {
        $product = $this->productService->updateStock(
            $id,
            $request->validated('stock')
        );

        return new ProductResource($product);
    }
}
