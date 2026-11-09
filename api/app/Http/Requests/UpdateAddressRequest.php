<?php

namespace App\Http\Requests;

class UpdateAddressRequest extends StoreAddressRequest
{
    public function rules(): array
    {
        return array_map(
            fn (array $rules) => array_merge(['sometimes'], $rules),
            parent::rules()
        );
    }
}
