<?php

declare(strict_types=1);

namespace App\Modules\Ai\Support;

use App\Modules\PageBuilder\Services\BlockRegistry;

class AiBlockSchema
{
    /**
     * AI generation now produces one complete design inside the existing
     * Custom HTML / CSS block instead of a tree of default builder blocks.
     *
     * @var list<string>
     */
    public const ALLOWED_BLOCKS = [
        'HtmlBlock',
    ];

    /**
     * @var array<string, list<string>>
     */
    public const ALLOWED_PROPS = [
        'HtmlBlock' => [
            'html',
            'css',
        ],
    ];

    /**
     * AI-generated styles are intentionally empty. The block keeps its
     * registry defaults so the generated design controls its own layout.
     *
     * @var array<string, list<string>>
     */
    public const ALLOWED_STYLES = [
        'HtmlBlock' => [],
    ];

    /**
     * @return list<string>
     */
    public static function allowedPropsFor(string $type): array
    {
        return self::ALLOWED_PROPS[$type] ?? [];
    }

    /**
     * @return list<string>
     */
    public static function allowedStylesFor(string $type): array
    {
        return self::ALLOWED_STYLES[$type] ?? [];
    }

    /**
     * Gemini receives a small top-level schema: one design, one HTML fragment,
     * and one scoped CSS string. The server wraps that result in an HtmlBlock.
     *
     * @return array<string, mixed>
     */
    public static function responseSchema(): array
    {
        return [
            'type' => 'object',
            'description' => 'A complete responsive landing-page design rendered inside one Custom HTML/CSS block.',
            'properties' => [
                'summary' => [
                    'type' => 'string',
                    'description' => 'Short plain-text summary of the generated design.',
                ],
                'html' => [
                    'type' => 'string',
                    'description' => 'Semantic HTML fragment only. No html, head, body, style, script, form, iframe, svg, id, inline style, or event handler attributes.',
                ],
                'css' => [
                    'type' => 'string',
                    'description' => 'Plain CSS for the HTML. No @import, @font-face, url(), external assets, fixed/sticky positioning, or z-index above 50.',
                ],
            ],
            'required' => ['html', 'css'],
        ];
    }

    /**
     * Ensure the generated block type is registered by the existing builder.
     *
     * @return list<string>
     */
    public static function approvedAndRegisteredBlocks(): array
    {
        return array_values(array_filter(
            self::ALLOWED_BLOCKS,
            static fn (string $type): bool => BlockRegistry::isApproved($type)
        ));
    }
}
