<?php

namespace App\Http\Requests;

class StoreProductRequest extends ProductRequest
{

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return array_merge([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'brand' => ['required','string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'image_url' => ['prohibited'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'characteristics_id' => ['required_without:characteristics','integer', 'exists:characteristics,id'],
            'category_id' => ['required','integer', 'exists:categories,id'],
            'active' => ['required', 'boolean'],
        ], $this->characteristicRules('required_without:characteristics_id'));
    }
}
