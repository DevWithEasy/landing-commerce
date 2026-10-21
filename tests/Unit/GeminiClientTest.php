<?php

declare(strict_types=1);

use App\Modules\Ai\Exceptions\AiGenerationException;
use App\Modules\Ai\Services\GeminiClient;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

/**
 * @return array<string, mixed>
 */
function geminiTextResponse(string $text = 'OK'): array
{
    return [
        'candidates' => [
            [
                'finishReason' => 'STOP',
                'content' => [
                    'parts' => [
                        ['text' => $text],
                    ],
                ],
            ],
        ],
    ];
}

test('connection test performs a real low-thinking generation probe', function () {
    Http::fake([
        '*' => Http::response(geminiTextResponse(), 200),
    ]);

    (new GeminiClient)->testConnection('AIzaSy_UNIT_SECRET_123', 'gemini-3.6-flash');

    Http::assertSent(function (ClientRequest $request): bool {
        $data = $request->data();

        return $request->method() === 'POST'
            && str_contains($request->url(), '/models/gemini-3.6-flash:generateContent')
            && $request->hasHeader('x-goog-api-key', 'AIzaSy_UNIT_SECRET_123')
            && ($data['generationConfig']['thinkingConfig']['thinkingLevel'] ?? null) === 'low'
            && ($data['generationConfig']['maxOutputTokens'] ?? null) === 1024;
    });
});

test('connection test uses minimal thinking for Flash Lite', function () {
    Http::fake([
        '*' => Http::response(geminiTextResponse(), 200),
    ]);

    (new GeminiClient)->testConnection('AIzaSy_UNIT_SECRET_123', 'gemini-3.5-flash-lite');

    Http::assertSent(function (ClientRequest $request): bool {
        $data = $request->data();

        return str_contains($request->url(), '/models/gemini-3.5-flash-lite:generateContent')
            && ($data['generationConfig']['thinkingConfig']['thinkingLevel'] ?? null) === 'minimal';
    });
});

test('connection test rejects a response without generated text', function () {
    Http::fake([
        '*' => Http::response(['candidates' => []], 200),
    ]);

    expect(fn () => (new GeminiClient)->testConnection('AIzaSy_UNIT_SECRET_123', 'gemini-3.6-flash'))
        ->toThrow(
            AiGenerationException::class,
            'Gemini did not return a usable design. Please try again.'
        );
});

test('connection test maps an invalid key to a safe message', function () {
    Http::fake([
        '*' => Http::response([
            'error' => ['message' => 'raw key detail AIzaSy_UNIT_SECRET_123'],
        ], 403),
    ]);

    expect(fn () => (new GeminiClient)->testConnection('AIzaSy_UNIT_SECRET_123', 'gemini-3.6-flash'))
        ->toThrow(
            AiGenerationException::class,
            'Gemini rejected the API key. Verify the key in Admin Settings and try again.'
        );
});
