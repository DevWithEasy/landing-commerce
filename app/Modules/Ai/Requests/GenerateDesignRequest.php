<?php

declare(strict_types=1);

namespace App\Modules\Ai\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateDesignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageLandingPages() ?? false;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'prompt' => ['required', 'string', 'min:5', 'max:2000'],
            'landing_page_id' => ['required', 'integer', 'exists:landing_pages,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('prompt'))) {
            $this->merge(['prompt' => trim($this->input('prompt'))]);
        }
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'prompt.required' => 'Describe the design you want to generate.',
            'prompt.min' => 'Please write a slightly more detailed design prompt.',
            'prompt.max' => 'The design prompt may not be longer than 2,000 characters.',
            'landing_page_id.required' => 'Open a landing page before generating a design.',
            'landing_page_id.exists' => 'The selected landing page could not be found.',
        ];
    }
}
