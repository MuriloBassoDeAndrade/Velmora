<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if (is_string($this->state)) {
            $merge['state'] = strtoupper(trim($this->state));
        }

        // Aceita 12345678 ou 12345-678 e guarda sempre como 12345-678.
        if (is_string($this->cep) && preg_match('/^\d{5}-?\d{3}$/', trim($this->cep))) {
            $digits = str_replace('-', '', trim($this->cep));
            $merge['cep'] = substr($digits, 0, 5) . '-' . substr($digits, 5);
        }

        $this->merge($merge);
    }

    public function rules(): array
    {
        return [
            'recipient_name' => ['required', 'string', 'max:100'],
            'street' => ['required', 'string', 'max:150'],
            'number' => ['required', 'string', 'max:20'],
            'complement' => ['nullable', 'string', 'max:100'],
            'neighborhood' => ['required', 'string', 'max:100'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['required', 'string', 'size:2', 'alpha'],
            'cep' => ['required', 'string', 'regex:/^\d{5}-\d{3}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'cep.regex' => 'O CEP deve ter 8 dígitos (ex.: 12345-678).',
            'state.size' => 'O estado deve ter 2 letras (ex.: PR).',
        ];
    }
}
