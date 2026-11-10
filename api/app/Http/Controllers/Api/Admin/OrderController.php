<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function __construct(private OrderService $orderService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return OrderResource::collection(
            $this->orderService->listAll($request->query('status'))
        );
    }

    public function show(Request $request, int $id): OrderResource
    {
        return new OrderResource(
            $this->orderService->findForUser($request->user(), $id)
        );
    }

    public function updateStatus(UpdateOrderStatusRequest $request, int $id): OrderResource
    {
        return new OrderResource(
            $this->orderService->updateStatus($id, $request->validated('status'), $request->user()->id)
        );
    }
}
