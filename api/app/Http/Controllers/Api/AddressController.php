<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAddressRequest;
use App\Http\Requests\UpdateAddressRequest;
use App\Http\Resources\AddressResource;
use App\Services\AddressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class AddressController extends Controller
{
    public function __construct(private AddressService $addressService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return AddressResource::collection(
            $this->addressService->listForUser($request->user())
        );
    }

    public function store(StoreAddressRequest $request): JsonResponse
    {
        $address = $this->addressService->create($request->user(), $request->validated());

        return (new AddressResource($address))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateAddressRequest $request, int $id): AddressResource
    {
        return new AddressResource(
            $this->addressService->update($request->user(), $id, $request->validated())
        );
    }

    public function destroy(Request $request, int $id): Response
    {
        $this->addressService->delete($request->user(), $id);

        return response()->noContent();
    }
}
