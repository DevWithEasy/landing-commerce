<?php

declare(strict_types=1);

namespace App\Modules\Payments\Requests;

use App\Modules\Payments\Models\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePaymentMethodRequest extends FormRequest
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
        /** @var PaymentMethod|null $paymentMethod */
        $paymentMethod = $this->route('payment_method');
        $id = $paymentMethod instanceof PaymentMethod ? $paymentMethod->id : $paymentMethod;

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'alpha_dash', Rule::unique('payment_methods', 'code')->ignore($id)],
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
