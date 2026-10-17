<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Requests;

use App\Modules\PageBuilder\Services\PageAstValidator;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreRevisionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->canManageLandingPages() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Standard structural check; full deep security AST validation handled in passedValidation / validator service
            'version' => ['sometimes', 'integer', 'min:1'],
            'blocks' => ['sometimes', 'array'],
        ];
    }

    /**
     * Handle a passed validation attempt by executing deep AST security validation.
     */
    protected function passedValidation(): void
    {
        $payload = $this->has('ast') && is_array($this->input('ast'))
            ? $this->input('ast')
            : $this->all();

        app(PageAstValidator::class)->validate($payload);
    }
}
