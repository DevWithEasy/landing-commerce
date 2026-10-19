<?php

declare(strict_types=1);

namespace App\Modules\Customer\Requests;

use App\Modules\Checkout\Rules\BdPhoneRule;
use Illuminate\Foundation\Http\FormRequest;

class TrackOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'token' => ['nullable', 'string', 'size:64'],
            'order_number' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', new BdPhoneRule],
        ];
    }
}
