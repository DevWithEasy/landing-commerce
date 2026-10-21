<?php

declare(strict_types=1);

namespace App\Modules\Ai\Support;

/**
 * Normalize a small set of known Gemini output variations before strict
 * validation. Unknown fields are preserved so AiAstValidator can reject them.
 */
class AiBlockNormalizer
{
    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function normalize(array $payload): array
    {
        $normalized = $payload;

        // Backward-compatible shape: a single HtmlBlock wrapper around the
        // html/css fields. New generations use the flat html/css schema.
        if (! isset($normalized['html'])
            && isset($normalized['blocks'])
            && is_array($normalized['blocks'])
            && count($normalized['blocks']) === 1) {
            $block = $normalized['blocks'][0] ?? null;

            if (is_array($block)
                && ($block['type'] ?? null) === 'HtmlBlock'
                && isset($block['props'])
                && is_array($block['props'])) {
                $normalized['html'] = $block['props']['html'] ?? null;
                $normalized['css'] = $block['props']['css'] ?? '';
                unset($normalized['blocks']);
            }
        }

        $aliases = [
            'htmlCode' => 'html',
            'markup' => 'html',
            'cssCode' => 'css',
            'styles' => 'css',
        ];

        foreach ($aliases as $alias => $canonical) {
            if (! array_key_exists($canonical, $normalized) && array_key_exists($alias, $normalized)) {
                $normalized[$canonical] = $normalized[$alias];
            }

            if (array_key_exists($alias, $normalized)) {
                unset($normalized[$alias]);
            }
        }

        if (isset($normalized['html']) && is_string($normalized['html'])) {
            $normalized['html'] = $this->stripCodeFence($normalized['html'], 'html');
        }

        if (isset($normalized['css']) && is_string($normalized['css'])) {
            $normalized['css'] = $this->stripCodeFence($normalized['css'], 'css');
        }

        return $normalized;
    }

    private function stripCodeFence(string $value, string $language): string
    {
        $value = trim($value);

        $pattern = '/^```(?:'.preg_quote($language, '/').')?\s*(.*?)\s*```$/is';

        if (preg_match($pattern, $value, $matches)) {
            return trim($matches[1]);
        }

        return $value;
    }
}
