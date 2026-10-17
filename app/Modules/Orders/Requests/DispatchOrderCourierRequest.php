<?php

declare(strict_types=1);

namespace App\Modules\Orders\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DispatchOrderCourierRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageOrders();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'driver' => ['nullable', 'string', 'in:mock,steadfast,pathao,redx'],
            'recipient_name' => ['nullable', 'string', 'max:255'],
            'recipient_phone' => ['nullable', 'string', 'max:20'],
            'recipient_address' => ['nullable', 'string', 'max:500'],
            'cod_amount' => ['nullable', 'numeric', 'min:0'],
            'note' => ['nullable', 'string', 'max:500'],
            'weight' => ['nullable', 'numeric', 'min:0.1'],
        ];
    }
}
