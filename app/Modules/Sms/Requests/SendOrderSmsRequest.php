<?php

declare(strict_types=1);

namespace App\Modules\Sms\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SendOrderSmsRequest extends FormRequest
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
            'template' => ['nullable', 'string'],
            'message' => ['nullable', 'string', 'max:500'],
            'driver' => ['nullable', 'string', 'in:mock,greenweb,ssl_wireless,smspoh'],
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param  Validator  $validator
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $template = $this->input('template');
            $message = $this->input('message');

            if ((empty($template) || $template === 'custom') && empty(trim((string) $message))) {
                $validator->errors()->add('message', 'Custom SMS message content is required when using custom template.');
            }
        });
    }
}
