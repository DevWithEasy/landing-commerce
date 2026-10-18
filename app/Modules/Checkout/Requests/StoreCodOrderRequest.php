<?php

declare(strict_types=1);

namespace App\Modules\Checkout\Requests;

use App\Modules\Checkout\Rules\BdPhoneRule;
use App\Modules\Checkout\Services\BlacklistService;
use App\Modules\Payments\Models\PaymentMethod;
use App\Modules\Shipping\Models\ShippingMethod;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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
            'shipping_method_id' => ['nullable', 'integer', 'exists:shipping_methods,id'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'payment_transaction_id' => ['nullable', 'string', 'max:100'],
            '_hp_trap' => ['nullable', 'prohibited'],
            'fax_number' => ['nullable', 'prohibited'],
            'honeypot' => ['nullable', 'prohibited'],
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            '_hp_trap.prohibited' => 'Spam bot submission detected.',
            'fax_number.prohibited' => 'Spam bot submission detected.',
            'honeypot.prohibited' => 'Spam bot submission detected.',
            'shipping_method_id.exists' => 'The selected shipping method is invalid.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $phone = (string) ($this->input('customer_phone') ?? $this->input('phone') ?? '');
            if ($phone !== '' && app(BlacklistService::class)->isBlacklisted($phone)) {
                $validator->errors()->add('phone', 'This phone number is blocked from placing orders.');
            }

            // Shipping method validation
            $shippingMethodId = $this->input('shipping_method_id');
            if ($shippingMethodId) {
                $method = ShippingMethod::active()->find($shippingMethodId);
                if (! $method) {
                    $validator->errors()->add('shipping_method_id', 'The selected shipping method is inactive or unavailable.');
                }
            }

            // Payment method validation
            $paymentCode = (string) ($this->input('payment_method') ?: 'cod');
            $paymentMethod = PaymentMethod::where('code', $paymentCode)->first();
            if ($paymentMethod && ! $paymentMethod->is_active) {
                $validator->errors()->add('payment_method', 'The selected payment method is unavailable.');
            } elseif ($paymentMethod && $paymentMethod->requires_transaction_id) {
                $trx = trim((string) $this->input('payment_transaction_id'));
                if (empty($trx)) {
                    $validator->errors()->add('payment_transaction_id', 'Transaction ID (TrxID) is required for '.$paymentMethod->name.'.');
                }
            }
        });
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
     *     shipping_method_id: int|null,
     *     payment_method: string,
     *     payment_transaction_id: string|null,
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
            'shipping_method_id' => isset($validated['shipping_method_id']) ? (int) $validated['shipping_method_id'] : null,
            'payment_method' => (string) ($validated['payment_method'] ?? 'cod'),
            'payment_transaction_id' => isset($validated['payment_transaction_id']) && trim((string) $validated['payment_transaction_id']) !== ''
                ? trim((string) $validated['payment_transaction_id'])
                : null,
            'items' => (array) $validated['items'],
        ];
    }
}
