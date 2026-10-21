<?php

declare(strict_types=1);

use App\Modules\Ai\Exceptions\AiGenerationException;
use App\Modules\Ai\Services\AiAstValidator;
use App\Modules\Ai\Services\AiBlockGenerator;
use App\Modules\Ai\Services\GeminiClient;
use App\Modules\Ai\Support\AiBlockNormalizer;
use App\Modules\Ai\Support\AiHtmlSanitizer;
use App\Modules\PageBuilder\Services\PageAstValidator;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

/**
 * @param  array<string, string>  $values
 */
function aiGeneratorSettings(array $values): SettingsService
{
    return new class($values) extends SettingsService
    {
        /**
         * @param  array<string, string>  $values
         */
        public function __construct(private array $values) {}

        public function get(string $key, mixed $default = null): mixed
        {
            return $this->values[$key] ?? $default;
        }

        public function has(string $key): bool
        {
            return isset($this->values[$key]) && $this->values[$key] !== '';
        }
    };
}

/**
 * @return array{html: string, css: string}
 */
function aiGeneratorValidDesign(): array
{
    return [
        'html' => '<section class="hero"><div class="hero-inner"><p class="eyebrow">New collection</p><h1>Premium everyday comfort</h1><p class="lead">Nationwide cash on delivery.</p><a class="cta" href="#cod-checkout">Order now</a></div></section>',
        'css' => '.hero { padding: 64px 24px; background: linear-gradient(135deg, #f8fafc, #dcfce7); } .hero-inner { max-width: 1120px; margin: 0 auto; text-align: center; } .hero h1 { color: #0f172a; font-size: clamp(2rem, 5vw, 4rem); line-height: 1.05; } .cta { display: inline-block; background: #16a34a; color: #ffffff; padding: 14px 28px; border-radius: 999px; } @media (max-width: 640px) { .hero { padding: 40px 16px; } }',
    ];
}

/**
 * @param  array<string, mixed>  $payload
 * @return array<string, mixed>
 */
function aiGeneratorResponseBody(array $payload): array
{
    return [
        'candidates' => [
            [
                'finishReason' => 'STOP',
                'content' => [
                    'parts' => [
                        [
                            'text' => json_encode($payload, JSON_THROW_ON_ERROR),
                        ],
                    ],
                ],
            ],
        ],
    ];
}

/**
 * @return array<string, mixed>
 */
function aiGeneratorDesignBody(string $html, string $css): array
{
    return aiGeneratorResponseBody([
        'summary' => 'Safe design',
        'html' => $html,
        'css' => $css,
    ]);
}

function aiGeneratorInstance(): AiBlockGenerator
{
    return new AiBlockGenerator(
        new GeminiClient,
        new AiAstValidator(new PageAstValidator, new AiHtmlSanitizer),
        new AiBlockNormalizer,
        aiGeneratorSettings([
            'ai.gemini.api_key' => 'AIzaSy_UNIT_SECRET_123',
            'ai.gemini.model' => 'gemini-3.6-flash',
            'ai.gemini.enabled' => '1',
        ])
    );
}

test('generator normalizes flat design aliases and markdown fences before validation', function () {
    $design = aiGeneratorValidDesign();

    Http::fake([
        '*' => Http::response(aiGeneratorResponseBody([
            'summary' => 'A clean hero.',
            'htmlCode' => "```html\n{$design['html']}\n```",
            'cssCode' => "```css\n{$design['css']}\n```",
        ]), 200),
    ]);

    $blocks = aiGeneratorInstance()->generate('Create a hero section with a heading, text, and COD button.');

    expect($blocks)->toHaveCount(1)
        ->and($blocks[0]['type'])->toBe('HtmlBlock')
        ->and($blocks[0]['props']['html'])->toContain('Premium everyday comfort')
        ->and($blocks[0]['props']['html'])->toContain('class="ai-design-')
        ->and($blocks[0]['props']['css'])->toContain('.ai-design-')
        ->and($blocks[0]['props']['css'])->toContain('.hero {');
});

test('generator rejects genuinely unsafe AI HTML and CSS', function (array $payload) {
    Http::fake([
        '*' => Http::response(aiGeneratorResponseBody($payload), 200),
    ]);

    expect(fn () => aiGeneratorInstance()->generate('Create a heading.'))
        ->toThrow(
            AiGenerationException::class,
            'The generated design contained unsupported or unsafe content and was not added. Please adjust the prompt and try again.'
        );
})->with([
    'script tag' => [[
        'html' => '<div><script>alert(1)</script></div>',
        'css' => '',
    ]],
    'inline event handler' => [[
        'html' => '<img src="https://example.com/a.jpg" onerror="alert(1)">',
        'css' => '',
    ]],
    'inline style' => [[
        'html' => '<div style="color:red">Unsafe</div>',
        'css' => '',
    ]],
    'unsafe CSS' => [[
        'html' => '<div class="safe">Safe</div>',
        'css' => '.safe { position: fixed; inset: 0; }',
    ]],
]);

test('generator sends a structured customer-owned Gemini request and returns one validated HtmlBlock', function () {
    $design = aiGeneratorValidDesign();

    Http::fake([
        '*' => Http::response(aiGeneratorDesignBody($design['html'], $design['css']), 200),
    ]);

    $blocks = aiGeneratorInstance()->generate('Create a premium hero section with a heading and COD button.');

    expect($blocks)->toHaveCount(1)
        ->and($blocks[0]['type'])->toBe('HtmlBlock')
        ->and($blocks[0]['id'])->toStartWith('blk_ai_')
        ->and($blocks[0]['props']['html'])->toContain('Premium everyday comfort')
        ->and($blocks[0]['props']['html'])->toContain('href="#cod-checkout"')
        ->and($blocks[0]['props']['css'])->toContain('.ai-design-');

    Http::assertSent(function (ClientRequest $request): bool {
        $data = $request->data();

        return str_contains($request->url(), '/models/gemini-3.6-flash:generateContent')
            && $request->hasHeader('x-goog-api-key', 'AIzaSy_UNIT_SECRET_123')
            && ($data['generationConfig']['responseMimeType'] ?? null) === 'application/json'
            && isset($data['generationConfig']['responseSchema']['properties']['html'])
            && isset($data['generationConfig']['responseSchema']['properties']['css'])
            && ! isset($data['generationConfig']['responseSchema']['properties']['blocks'])
            && ($data['generationConfig']['temperature'] ?? null) === 0.6
            && ($data['generationConfig']['maxOutputTokens'] ?? null) === 16384
            && ($data['generationConfig']['thinkingConfig']['thinkingLevel'] ?? null) === 'low'
            && str_contains((string) ($data['systemInstruction']['parts'][0]['text'] ?? ''), 'Custom HTML / CSS')
            && str_contains((string) ($data['systemInstruction']['parts'][0]['text'] ?? ''), 'Tailwind');
    });
});

test('generator refuses to call Gemini when the key is missing or AI is disabled', function (array $settings, string $expectedMessage) {
    Http::fake();

    $generator = new AiBlockGenerator(
        new GeminiClient,
        new AiAstValidator(new PageAstValidator, new AiHtmlSanitizer),
        new AiBlockNormalizer,
        aiGeneratorSettings($settings)
    );

    expect(fn () => $generator->generate('Create a safe hero section with a heading.'))
        ->toThrow(AiGenerationException::class, $expectedMessage);

    Http::assertNothingSent();
})->with([
    'missing key' => [[
        'ai.gemini.model' => 'gemini-3.6-flash',
        'ai.gemini.enabled' => '1',
    ], 'AI generation is not configured. Add your Google AI Studio API key in Admin Settings.'],
    'disabled' => [[
        'ai.gemini.api_key' => 'AIzaSy_UNIT_SECRET_123',
        'ai.gemini.model' => 'gemini-3.6-flash',
        'ai.gemini.enabled' => '0',
    ], 'AI generation is currently disabled. Enable it in Admin Settings before generating a design.'],
]);

test('generator maps malformed JSON and upstream failures to safe messages', function () {
    Http::fakeSequence()
        ->push([
            'candidates' => [[
                'finishReason' => 'STOP',
                'content' => ['parts' => [['text' => 'not-json']]],
            ]],
        ], 200)
        ->push(['error' => ['message' => 'raw key detail AIzaSy_LEAKED']], 403);

    $generator = aiGeneratorInstance();

    expect(fn () => $generator->generate('Create a safe hero section with a heading.'))
        ->toThrow(AiGenerationException::class, 'Gemini returned an invalid design. Please try again.');

    expect(fn () => $generator->generate('Create a safe hero section with a heading.'))
        ->toThrow(AiGenerationException::class, 'Gemini rejected the API key. Verify the key in Admin Settings and try again.');
});

test('generator falls back to the default model when the saved model is unavailable', function () {
    $design = aiGeneratorValidDesign();

    Http::fake([
        '*' => Http::response(aiGeneratorDesignBody($design['html'], $design['css']), 200),
    ]);

    $generator = new AiBlockGenerator(
        new GeminiClient,
        new AiAstValidator(new PageAstValidator, new AiHtmlSanitizer),
        new AiBlockNormalizer,
        aiGeneratorSettings([
            'ai.gemini.api_key' => 'AIzaSy_UNIT_SECRET_123',
            'ai.gemini.model' => 'gemini-3.8-flash',
            'ai.gemini.enabled' => '1',
        ])
    );

    $blocks = $generator->generate('Create a premium hero section with a heading and COD button.');

    expect($blocks)->toHaveCount(1)
        ->and($blocks[0]['type'])->toBe('HtmlBlock');

    Http::assertSent(function (ClientRequest $request): bool {
        return str_contains($request->url(), '/models/gemini-3.6-flash:generateContent');
    });
});
