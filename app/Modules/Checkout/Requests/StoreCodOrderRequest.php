<?php

declare(strict_types=1);

namespace App\Modules\Checkout\Requests;

use App\Modules\Checkout\Rules\BdPhoneRule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCodOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'customer_name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'required', new BdPhoneRule],
            'customer_phone' => ['sometimes', 'required', new BdPhoneRule],
            'address' => ['sometimes', 'required', 'string'],
            'delivery_address' => ['sometimes', 'required', 'string'],
            'district' => ['required', 'string', 'max:100'],
            'upazila' => ['nullable', 'string', 'max:100'],
            'idempotency_key' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * Normalize validated fields into consistent domain keys.
     *
     * @return array{
     *     customer_name: string,
     *     customer_phone: string,
     *     delivery_address: string,
     *     district: string,
     *     upazila: string|null,
     *     idempotency_key: string,
     *     notes: string|null,
     *     discount: float|null,
     *     items: array<int, array{variant_id: int, quantity: int}>
     * }
     */
    public function toOrderPayload(): array
    {
        $validated = $this->validated();

        return [
            'customer_name' => (string) ($validated['customer_name'] ?? $validated['name'] ?? ''),
            'customer_phone' => (string) ($validated['customer_phone'] ?? $validated['phone'] ?? ''),
            'delivery_address' => (string) ($validated['delivery_address'] ?? $validated['address'] ?? ''),
            'district' => (string) ($validated['district'] ?? ''),
            'upazila' => isset($validated['upazila']) ? (string) $validated['upazila'] : null,
            'idempotency_key' => (string) $validated['idempotency_key'],
            'notes' => isset($validated['notes']) ? (string) $validated['notes'] : null,
            'discount' => isset($validated['discount']) ? (float) $validated['discount'] : null,
            'items' => (array) $validated['items'],
        ];
    }
}
