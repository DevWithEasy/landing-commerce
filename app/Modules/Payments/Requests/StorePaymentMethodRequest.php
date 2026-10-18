<?php

declare(strict_types=1);

namespace App\Modules\Payments\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageShippingAndPayments() ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'alpha_dash', 'unique:payment_methods,code'],
            'description' => ['nullable', 'string'],
            'instructions' => ['nullable', 'string'],
            'account_number' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
            'is_online' => ['boolean'],
            'requires_transaction_id' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
