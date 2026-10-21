<?php

declare(strict_types=1);

use App\Modules\Ai\Exceptions\AiResponseValidationException;
use App\Modules\Ai\Services\AiAstValidator;
use App\Modules\Ai\Support\AiBlockNormalizer;
use App\Modules\Ai\Support\AiHtmlSanitizer;
use App\Modules\PageBuilder\Services\PageAstValidator;
use Tests\TestCase;

uses(TestCase::class);

test('normalizer maps known aliases and strips markdown code fences', function () {
    $payload = [
        'summary' => 'A complete hero design.',
        'htmlCode' => "```html\n<section class=\"hero\"><h1>Hello</h1></section>\n```",
        'cssCode' => "```css\n.hero { padding: 40px; }\n```",
    ];

    $normalized = (new AiBlockNormalizer)->normalize($payload);

    expect($normalized['html'])->toBe('<section class="hero"><h1>Hello</h1></section>')
        ->and($normalized['css'])->toBe('.hero { padding: 40px; }')
        ->and($normalized)->not->toHaveKey('htmlCode')
        ->and($normalized)->not->toHaveKey('cssCode');
});

test('normalizer accepts a legacy single HtmlBlock wrapper', function () {
    $payload = [
        'summary' => 'Legacy shape.',
        'blocks' => [
            [
                'type' => 'HtmlBlock',
                'props' => [
                    'html' => '<section class="hero"><h1>Hello</h1></section>',
                    'css' => '.hero { padding: 40px; }',
                ],
            ],
        ],
    ];

    $normalized = (new AiBlockNormalizer)->normalize($payload);

    expect($normalized['html'])->toBe('<section class="hero"><h1>Hello</h1></section>')
        ->and($normalized['css'])->toBe('.hero { padding: 40px; }')
        ->and($normalized)->not->toHaveKey('blocks');
});

test('normalizer preserves genuinely unknown fields so strict validation still rejects them', function () {
    $payload = [
        'html' => '<div class="safe">Safe</div>',
        'css' => '.safe { color: #111111; }',
        'blocks' => [
            ['type' => 'HeadingBlock'],
        ],
    ];

    $normalized = (new AiBlockNormalizer)->normalize($payload);

    expect($normalized)->toHaveKey('blocks');

    $validator = new AiAstValidator(new PageAstValidator, new AiHtmlSanitizer);

    expect(fn () => $validator->validate($normalized))
        ->toThrow(AiResponseValidationException::class);
});
