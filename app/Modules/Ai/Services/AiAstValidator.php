<?php

declare(strict_types=1);

namespace App\Modules\Ai\Services;

use App\Modules\Ai\Exceptions\AiResponseValidationException;
use App\Modules\Ai\Support\AiHtmlSanitizer;
use App\Modules\PageBuilder\Services\BlockRegistry;
use App\Modules\PageBuilder\Services\PageAstValidator;
use Throwable;

class AiAstValidator
{
    private const MAX_HTML_BYTES = 80_000;

    private const MAX_CSS_BYTES = 40_000;

    private const MAX_SUMMARY_LENGTH = 300;

    public function __construct(
        protected PageAstValidator $pageAstValidator,
        protected AiHtmlSanitizer $htmlSanitizer
    ) {}

    /**
     * Validate and sanitize an untrusted Gemini design response.
     *
     * @param  array<string, mixed>  $payload
     * @return list<array<string, mixed>>
     */
    public function validate(array $payload): array
    {
        $unknownKeys = array_diff(array_keys($payload), ['summary', 'html', 'css']);

        if ($unknownKeys !== []) {
            throw new AiResponseValidationException('Gemini returned unsupported design fields.');
        }

        $html = $payload['html'] ?? null;

        if (! is_string($html) || trim($html) === '') {
            throw new AiResponseValidationException('Gemini returned an empty design.');
        }

        if (strlen($html) > self::MAX_HTML_BYTES) {
            throw new AiResponseValidationException('Gemini returned HTML that was too large.');
        }

        $css = $payload['css'] ?? '';

        if (! is_string($css)) {
            throw new AiResponseValidationException('Gemini returned invalid CSS.');
        }

        if (strlen($css) > self::MAX_CSS_BYTES) {
            throw new AiResponseValidationException('Gemini returned CSS that was too large.');
        }

        if (array_key_exists('summary', $payload)) {
            $this->assertSummary($payload['summary']);
        }

        if (! BlockRegistry::isApproved('HtmlBlock')) {
            throw new AiResponseValidationException('The Custom HTML / CSS block is not registered.');
        }

        $scopeClass = 'ai-design-'.bin2hex(random_bytes(6));
        $sanitized = $this->htmlSanitizer->sanitize($html, $css, $scopeClass);

        $block = [
            'id' => 'blk_ai_'.bin2hex(random_bytes(8)),
            'type' => 'HtmlBlock',
            'props' => [
                'html' => $sanitized['html'],
                'css' => $sanitized['css'],
            ],
            'styles' => [
                // The generated design controls its own spacing. Avoid the
                // manual block's 12px inset so full-width sections stay flush.
                'paddingTop' => '0px',
                'paddingBottom' => '0px',
            ],
        ];

        // Defense in depth: the existing revision validator must also accept
        // the sanitized block before it can reach the builder canvas.
        try {
            $this->pageAstValidator->validate([
                'version' => 1,
                'blocks' => [$block],
            ]);
        } catch (Throwable) {
            throw new AiResponseValidationException(
                'Gemini returned a design that failed safety validation.'
            );
        }

        return [$block];
    }

    private function assertSummary(mixed $summary): void
    {
        if (! is_string($summary)) {
            throw new AiResponseValidationException('Gemini returned an invalid design summary.');
        }

        if (mb_strlen(trim($summary)) > self::MAX_SUMMARY_LENGTH) {
            throw new AiResponseValidationException('Gemini returned a design summary that was too long.');
        }

        if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $summary)) {
            throw new AiResponseValidationException('Gemini returned invalid control characters.');
        }
    }
}
