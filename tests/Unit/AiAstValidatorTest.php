<?php

declare(strict_types=1);

use App\Modules\Ai\Exceptions\AiResponseValidationException;
use App\Modules\Ai\Services\AiAstValidator;
use App\Modules\Ai\Support\AiBlockSchema;
use App\Modules\Ai\Support\AiHtmlSanitizer;
use App\Modules\PageBuilder\Services\PageAstValidator;
use Tests\TestCase;

uses(TestCase::class);

/**
 * @return array{summary: string, html: string, css: string}
 */
function aiUnitValidDesign(): array
{
    return [
        'summary' => 'A clean hero design.',
        'html' => '<section class="hero"><h1>Premium everyday comfort</h1><a class="cta" href="#cod-checkout">Order now</a></section>',
        'css' => '.hero { padding: 48px 24px; background: linear-gradient(135deg, #f8fafc, #dcfce7); } .hero h1 { color: #0f172a; font-size: 3rem; } .cta { display: inline-block; background: #16a34a; color: #ffffff; padding: 14px 28px; border-radius: 999px; }',
    ];
}

function aiUnitValidator(): AiAstValidator
{
    return new AiAstValidator(new PageAstValidator, new AiHtmlSanitizer);
}

test('AI block schema only permits the Custom HTML block', function () {
    expect(AiBlockSchema::ALLOWED_BLOCKS)->toBe(['HtmlBlock'])
        ->and(AiBlockSchema::approvedAndRegisteredBlocks())->toBe(AiBlockSchema::ALLOWED_BLOCKS)
        ->and(AiBlockSchema::ALLOWED_PROPS['HtmlBlock'])->toBe(['html', 'css'])
        ->and(AiBlockSchema::ALLOWED_STYLES['HtmlBlock'])->toBe([]);
});

test('AI response schema is a flat html and css design payload', function () {
    $schema = AiBlockSchema::responseSchema();
    $properties = $schema['properties'] ?? [];

    expect(array_keys($properties))->toEqualCanonicalizing(['summary', 'html', 'css'])
        ->and($schema['required'])->toBe(['html', 'css'])
        ->and($properties)->not->toHaveKey('blocks')
        ->and($properties['html']['type'])->toBe('string')
        ->and($properties['css']['type'])->toBe('string');
});

test('AI validator creates one scoped HtmlBlock with a server ID and zero inset', function () {
    $blocks = aiUnitValidator()->validate(aiUnitValidDesign());

    expect($blocks)->toHaveCount(1)
        ->and($blocks[0]['type'])->toBe('HtmlBlock')
        ->and($blocks[0]['id'])->toStartWith('blk_ai_')
        ->and($blocks[0]['props']['html'])->toContain('class="ai-design-')
        ->and($blocks[0]['props']['html'])->toContain('Premium everyday comfort')
        ->and($blocks[0]['props']['css'])->toContain('.ai-design-')
        ->and($blocks[0]['props']['css'])->toContain('.hero {')
        ->and($blocks[0]['styles'])->toMatchArray(['paddingTop' => '0px', 'paddingBottom' => '0px'])
        ->and($blocks[0])->not->toHaveKey('children');
});

test('AI validator output remains compatible with the existing revision AST validator', function () {
    $blocks = aiUnitValidator()->validate(aiUnitValidDesign());

    $validated = (new PageAstValidator)->validate([
        'version' => 1,
        'blocks' => $blocks,
    ]);

    expect($validated['blocks'][0]['type'])->toBe('HtmlBlock')
        ->and($validated['blocks'][0]['props']['html'])->toContain('ai-design-');
});

test('AI validator rejects unsupported fields, unsafe content, and AI-supplied IDs', function (array $payload) {
    expect(fn () => aiUnitValidator()->validate($payload))
        ->toThrow(AiResponseValidationException::class);
})->with([
    'unknown top-level field' => [[
        'html' => '<div class="safe">Safe</div>',
        'css' => '.safe { color: #111111; }',
        'blocks' => [],
    ]],
    'AI supplied ID' => [[
        'id' => 'blk_ai_customer_supplied',
        'html' => '<div class="safe">Safe</div>',
        'css' => '.safe { color: #111111; }',
    ]],
    'missing HTML' => [[
        'css' => '.safe { color: #111111; }',
    ]],
    'empty HTML' => [[
        'html' => '   ',
        'css' => '',
    ]],
    'HTML with script' => [[
        'html' => '<div><script>alert(1)</script></div>',
        'css' => '',
    ]],
    'HTML with inline event handler' => [[
        'html' => '<img src="https://example.com/a.jpg" onerror="alert(1)">',
        'css' => '',
    ]],
    'HTML with inline style' => [[
        'html' => '<div style="color:red">Unsafe</div>',
        'css' => '',
    ]],
    'HTML with form' => [[
        'html' => '<form action="https://evil.test"><input name="card"></form>',
        'css' => '',
    ]],
    'unsafe CSS import' => [[
        'html' => '<div class="safe">Safe</div>',
        'css' => '@import url(https://evil.test/a.css);',
    ]],
    'unsafe CSS url' => [[
        'html' => '<div class="safe">Safe</div>',
        'css' => '.safe { background: url(https://evil.test/a.png); }',
    ]],
    'fixed overlay CSS' => [[
        'html' => '<div class="safe">Safe</div>',
        'css' => '.safe { position: fixed; inset: 0; }',
    ]],
    'high z-index CSS' => [[
        'html' => '<div class="safe">Safe</div>',
        'css' => '.safe { z-index: 999; }',
    ]],
    'non-string CSS' => [[
        'html' => '<div class="safe">Safe</div>',
        'css' => ['color' => 'red'],
    ]],
]);

test('AI validator rejects excessive HTML and CSS size', function () {
    $tooLargeHtml = '<div class="safe">'.str_repeat('A', 80_001).'</div>';
    $tooLargeCss = str_repeat('.safe { color: #111111; }', 2_000);

    expect(fn () => aiUnitValidator()->validate([
        'html' => $tooLargeHtml,
        'css' => '',
    ]))->toThrow(AiResponseValidationException::class);

    expect(fn () => aiUnitValidator()->validate([
        'html' => '<div class="safe">Safe</div>',
        'css' => $tooLargeCss,
    ]))->toThrow(AiResponseValidationException::class);
});

test('AI validator rejects excessive nesting', function () {
    $html = '<div>'.str_repeat('<div>', 25).'Deep'.str_repeat('</div>', 25).'</div>';

    expect(fn () => aiUnitValidator()->validate([
        'html' => $html,
        'css' => '',
    ]))->toThrow(AiResponseValidationException::class);
});
