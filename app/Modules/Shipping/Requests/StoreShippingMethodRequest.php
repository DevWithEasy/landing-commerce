<?php

declare(strict_types=1);

namespace App\Modules\Shipping\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreShippingMethodRequest extends FormRequest
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
            'code' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'zone_code' => ['nullable', 'string', 'in:inside_dhaka,sub_dhaka,outside_dhaka,all'],
            'shipping_zone_id' => ['nullable', 'integer', 'exists:shipping_zones,id'],
            'rate' => ['required', 'numeric', 'min:0'],
            'delivery_time' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
            'is_default' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
