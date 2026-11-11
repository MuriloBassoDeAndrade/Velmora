<?php

namespace App\Http\Requests;

class UpdateProductRequest extends ProductRequest
{

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return array_merge([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'brand' => ['sometimes','string', 'max:255'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'image_url' => ['prohibited'],
            'image' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'characteristics_id' => ['sometimes','integer', 'exists:characteristics,id'],
            'category_id' => ['sometimes','integer', 'exists:categories,id'],
            'active' => ['sometimes', 'boolean'],
        ], $this->characteristicRules('sometimes'));
    }
}
