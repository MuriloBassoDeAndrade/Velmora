<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'brand' => ['sometimes','string', 'max:255'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'image_url' => ['sometimes', 'nullable', 'url'],
            'characteristics_id' => ['sometimes','integer', 'exists:characteristics,id'],
            'category_id' => ['sometimes','integer', 'exists:categories,id'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
