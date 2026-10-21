<?php

declare(strict_types=1);

namespace App\Modules\Ai\Services;

use App\Modules\Ai\Exceptions\AiGenerationException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class GeminiClient
{
    /**
     * Send a structured generation request using the customer's own API key.
     *
     * @param  array<string, mixed>  $payload
     */
    public function generateContent(
        string $apiKey,
        string $model,
        array $payload,
        ?int $timeout = null
    ): string {
        $response = $this->send(
            method: 'post',
            apiKey: $apiKey,
            model: $model,
            payload: $payload,
            timeout: $timeout ?? (int) config('ai.gemini.timeout_seconds', 120)
        );

        $data = $response->json();

        if (! is_array($data)) {
            throw new AiGenerationException('Gemini returned an invalid response. Please try again.');
        }

        $blockReason = $data['promptFeedback']['blockReason'] ?? null;
        if (is_string($blockReason) && $blockReason !== '') {
            throw new AiGenerationException('Gemini refused to generate this design. Please adjust the prompt and try again.');
        }

        $candidates = $data['candidates'] ?? null;
        if (! is_array($candidates) || $candidates === []) {
            throw new AiGenerationException('Gemini did not return a usable design. Please try again.');
        }

        $text = '';
        foreach ($candidates as $candidate) {
            if (! is_array($candidate)) {
                continue;
            }

            $finishReason = $candidate['finishReason'] ?? null;
            if (is_string($finishReason) && in_array($finishReason, [
                'SAFETY',
                'RECITATION',
                'BLOCKLIST',
                'PROHIBITED_CONTENT',
                'SPII',
            ], true)) {
                throw new AiGenerationException('Gemini refused to generate this design. Please adjust the prompt and try again.');
            }

            if ($finishReason === 'MAX_TOKENS') {
                throw new AiGenerationException('The generated design was incomplete. Please use a shorter prompt and try again.');
            }

            $parts = $candidate['content']['parts'] ?? null;
            if (! is_array($parts)) {
                continue;
            }

            foreach ($parts as $part) {
                if (is_array($part) && isset($part['text']) && is_string($part['text'])) {
                    $text .= $part['text'];
                }
            }
        }

        $text = trim($text);
        if ($text === '') {
            throw new AiGenerationException('Gemini did not return a usable design. Please try again.');
        }

        return $text;
    }

    /**
     * Verify that the customer's key can actually generate content with the
     * selected model. A model-listing request is not enough because generation
     * has different latency, quota, and thinking behavior.
     */
    public function testConnection(string $apiKey, string $model): void
    {
        $this->generateContent(
            $apiKey,
            $model,
            [
                'contents' => [
                    [
                        'role' => 'user',
                        'parts' => [
                            [
                                'text' => 'Reply with exactly: OK',
                            ],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0,
                    'maxOutputTokens' => 1024,
                    'thinkingConfig' => [
                        'thinkingLevel' => $this->thinkingLevel($model),
                    ],
                ],
            ],
            (int) config('ai.gemini.test_timeout_seconds', 60)
        );
    }

    private function thinkingLevel(string $model): string
    {
        $levels = (array) config('ai.gemini.thinking_levels', []);

        return (string) ($levels[$model] ?? config('ai.gemini.default_thinking_level', 'low'));
    }

    /**
     * @param  array<string, mixed>|null  $payload
     */
    private function send(
        string $method,
        string $apiKey,
        string $model,
        ?array $payload,
        int $timeout
    ): Response {
        $baseUrl = rtrim((string) config('ai.gemini.base_url'), '/');
        $url = $baseUrl.'/models/'.rawurlencode($model).($method === 'post' ? ':generateContent' : '');

        try {
            $request = Http::withHeaders([
                'x-goog-api-key' => $apiKey,
                'Accept' => 'application/json',
            ])
                ->connectTimeout((int) config('ai.gemini.connect_timeout_seconds', 10))
                ->timeout($timeout);

            $response = $method === 'post'
                ? $request->post($url, $payload ?? [])
                : $request->get($url);
        } catch (ConnectionException $exception) {
            Log::warning('Gemini connection failed.', [
                'method' => $method,
                'model' => $model,
                'error' => str_replace($apiKey, '[redacted]', $exception->getMessage()),
            ]);

            throw new AiGenerationException(
                'Could not reach Gemini or the request timed out. Please check the server connection and try again.',
                504
            );
        } catch (Throwable $exception) {
            Log::warning('Gemini request failed unexpectedly.', [
                'method' => $method,
                'model' => $model,
                'error' => str_replace($apiKey, '[redacted]', $exception->getMessage()),
            ]);

            throw new AiGenerationException('The Gemini request failed. Please try again.', 502);
        }

        if (! $response->successful()) {
            Log::warning('Gemini API returned an error status.', [
                'method' => $method,
                'model' => $model,
                'status' => $response->status(),
            ]);

            throw $this->safeHttpError($response->status());
        }

        return $response;
    }

    private function safeHttpError(int $status): AiGenerationException
    {
        if (in_array($status, [401, 403], true)) {
            return new AiGenerationException(
                'Gemini rejected the API key. Verify the key in Admin Settings and try again.',
                422
            );
        }

        if ($status === 404) {
            return new AiGenerationException(
                'The selected Gemini model is not available for this key. Choose another model in Admin Settings.',
                422
            );
        }

        if ($status === 429) {
            return new AiGenerationException(
                'Gemini API quota or rate limit reached. Please wait a moment and try again.',
                429
            );
        }

        if ($status >= 500) {
            return new AiGenerationException(
                'Gemini is temporarily unavailable. Please try again shortly.',
                502
            );
        }

        return new AiGenerationException(
            'Gemini rejected the request. Check the selected model and try again.',
            422
        );
    }
}
