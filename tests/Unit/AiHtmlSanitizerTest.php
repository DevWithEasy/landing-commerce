<?php

declare(strict_types=1);

use App\Modules\Ai\Exceptions\AiResponseValidationException;
use App\Modules\Ai\Support\AiHtmlSanitizer;
use Tests\TestCase;

uses(TestCase::class);

function aiSanitizer(): AiHtmlSanitizer
{
    return new AiHtmlSanitizer;
}

test('safe HTML is rebuilt and CSS is scoped to the generated block', function () {
    $html = '<section class="hero"><h1>হ্যালো</h1><a class="cta" href="#cod-checkout">অর্ডার করুন</a></section>';
    $css = '.hero { padding: 40px; } .hero h1 { color: #0f172a; } @media (max-width: 600px) { .hero { padding: 20px; } } @keyframes fade { from { opacity: 0; } to { opacity: 1; } } .hero { animation: fade 1s; }';

    $result = aiSanitizer()->sanitize($html, $css, 'ai-design-abc123');

    expect($result['html'])->toContain('<div class="ai-design-abc123">')
        ->and($result['html'])->toContain('হ্যালো')
        ->and($result['html'])->toContain('href="#cod-checkout"')
        ->and($result['html'])->toContain("  <section class=\"hero\">\n    <h1>হ্যালো</h1>")
        ->and($result['css'])->toContain('.ai-design-abc123 .hero {')
        ->and($result['css'])->toContain('@media (max-width: 600px) {')
        ->and($result['css'])->toContain("  .ai-design-abc123 .hero {\n    padding: 20px;\n  }")
        ->and($result['css'])->toContain('@keyframes fade {')
        ->and($result['css'])->toContain("  from {\n    opacity: 0;\n  }")
        ->and($result['css'])->not->toContain('.ai-design-abc123 @keyframes');
});

test('pretty printing preserves inline spacing and preformatted content', function () {
    $html = '<div class="card"><p>Hello <strong>world</strong>!</p><pre>  keep'."\n".'    this</pre></div>';

    $result = aiSanitizer()->sanitize($html, '', 'ai-design-abc123');

    expect($result['html'])->toContain('<p>Hello <strong>world</strong>!</p>')
        ->and($result['html'])->toContain("<pre>  keep\n    this</pre>");
});

test('safe absolute positioning and important numeric z-index are allowed', function () {
    $result = aiSanitizer()->sanitize(
        '<div class="safe">Safe</div>',
        '.safe { position: absolute; top: 0; z-index: 10 !important; }',
        'ai-design-abc123'
    );

    expect($result['css'])->toContain('position: absolute')
        ->and($result['css'])->toContain('z-index: 10 !important');
});

test('root, html, and body selectors are mapped to the generated wrapper', function () {
    $html = '<div class="card"><h2>Title</h2></div>';
    $css = ':root { --brand: #16a34a; } html { font-size: 16px; } body { margin: 0; font-family: Arial, sans-serif; } body .card { color: var(--brand); }';

    $result = aiSanitizer()->sanitize($html, $css, 'ai-design-abc123');

    expect($result['css'])->toContain(".ai-design-abc123 {\n  --brand: #16a34a;\n}")
        ->and($result['css'])->toContain(".ai-design-abc123 {\n  font-size: 16px;\n}")
        ->and($result['css'])->toContain(".ai-design-abc123 {\n  margin: 0;\n  font-family: Arial, sans-serif;\n}")
        ->and($result['css'])->toContain(".ai-design-abc123 .card {\n  color: var(--brand);\n}")
        ->and($result['css'])->not->toContain('.ai-design-abc123 :root');
});

test('safe links and images are accepted and blank targets receive safe rel values', function () {
    $html = '<div class="card"><a href="https://example.com/product" target="_blank" rel="nofollow">View</a><img src="/storage/product.webp" alt="Product" width="640" height="480" loading="lazy"></div>';

    $result = aiSanitizer()->sanitize($html, '.card { display: grid; }', 'ai-design-safe12');

    expect($result['html'])->toContain('rel="nofollow noopener noreferrer"')
        ->and($result['html'])->toContain('src="/storage/product.webp"')
        ->and($result['html'])->toContain('loading="lazy"');
});

test('unsafe HTML is rejected', function (string $html) {
    expect(fn () => aiSanitizer()->sanitize($html, '', 'ai-design-abc123'))
        ->toThrow(AiResponseValidationException::class);
})->with([
    'script tag' => ['<div><script>alert(1)</script></div>'],
    'iframe' => ['<iframe src="https://example.com"></iframe>'],
    'inline event handler' => ['<img src="https://example.com/a.jpg" onerror="alert(1)">'],
    'javascript URL' => ['<a href="javascript:alert(1)">Click</a>'],
    'entity-obfuscated javascript URL' => ['<a href="java&#x73;cript:alert(1)">Click</a>'],
    'data URL' => ['<img src="data:image/svg+xml;base64,PHN2Zz4=">'],
    'inline style' => ['<div style="color: red">Blocked</div>'],
    'id attribute' => ['<div id="customer-content">Blocked</div>'],
    'form element' => ['<form action="https://evil.test"><input name="card"></form>'],
    'svg element' => ['<svg><path d="M0 0"></path></svg>'],
    'protocol-relative image' => ['<img src="//evil.test/a.png" alt="Bad">'],
    'unknown element' => ['<marquee>Blocked</marquee>'],
]);

test('unsafe CSS is rejected', function (string $css) {
    expect(fn () => aiSanitizer()->sanitize('<div class="safe">Safe</div>', $css, 'ai-design-abc123'))
        ->toThrow(AiResponseValidationException::class);
})->with([
    'import' => ['@import url(https://evil.test/a.css);'],
    'font-face' => ['@font-face { font-family: Evil; src: url(https://evil.test/a.woff2); }'],
    'url' => ['.safe { background: url(https://evil.test/a.png); }'],
    'expression' => ['.safe { width: expression(alert(1)); }'],
    'javascript' => ['.safe { color: javascript:alert(1); }'],
    'fixed position' => ['.safe { position: fixed; inset: 0; }'],
    'sticky position' => ['.safe { position: sticky; top: 0; }'],
    'webkit sticky position' => ['.safe { position: -webkit-sticky; top: 0; }'],
    'position variable bypass' => [':root { --pos: fixed; } .safe { position: var(--pos); }'],
    'high z-index' => ['.safe { z-index: 51; }'],
    'escaped property' => ['.safe { position: f\\69 xed; }'],
    'control character' => [".safe { color: re\x00d; }"],
    'unknown at-rule' => ['@layer utilities { .safe { color: red; } }'],
    'style injection' => ['.safe { background: red; } </style><script>alert(1)</script>'],
]);

test('excessive HTML nesting is rejected', function () {
    $html = '<div>'.str_repeat('<div>', 25).'Deep'.str_repeat('</div>', 25).'</div>';

    expect(fn () => aiSanitizer()->sanitize($html, '', 'ai-design-abc123'))
        ->toThrow(AiResponseValidationException::class);
});

test('excessive HTML size is rejected', function () {
    $html = '<div>'.str_repeat('A', 80_001).'</div>';

    expect(fn () => aiSanitizer()->sanitize($html, '', 'ai-design-abc123'))
        ->toThrow(AiResponseValidationException::class);
});
