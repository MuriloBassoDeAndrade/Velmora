<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CharacteristicService;
use App\Http\Resources\CharacteristicResource;
use App\Http\Requests\StoreCharacteristicRequest;
use App\Http\Requests\UpdateCharacteristicRequest;


class CharacteristicController extends Controller
{

    public function __construct(private CharacteristicService $characteristicService) {}

    public function index()
    {
     return CharacteristicResource::collection($this->characteristicService->getAll());
    }

    public function show(int $id)
    {
        $characteristic = $this->characteristicService->getById($id);
        return new CharacteristicResource($characteristic);
    }

    public function store(StoreCharacteristicRequest $request)
    {
        $data = $request->validated();
        $characteristic = $this->characteristicService->create($data);
        return (new CharacteristicResource($characteristic))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateCharacteristicRequest $request, int $id)
    {
        $data = $request->validated();
        $characteristic = $this->characteristicService->update($id, $data);
        return new CharacteristicResource($characteristic);
    }

    public function destroy(int $id)
    {
        $this->characteristicService->delete($id);
        return response()->noContent();
    }
}
