<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Customer-Owned Gemini Configuration
    |--------------------------------------------------------------------------
    |
    | Each self-hosted installation stores its own Google AI Studio API key in
    | the encrypted settings vault. No platform-wide or shared key is used.
    |
    */

    'gemini' => [
        'base_url' => env('GEMINI_API_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),

        'default_model' => env('GEMINI_DEFAULT_MODEL', 'gemini-3.6-flash'),

        /*
        | Keep this list limited to documented, stable Gemini models that support
        | GenerateContent with structured JSON output.
        |
        | gemini-3.8-flash is intentionally omitted: its generateContent endpoint
        | currently accepts the request but never returns a response from this
        | environment, while model listing and the models below work normally.
        |
        | @var array<string, string>
        */
        'models' => [
            'gemini-3.6-flash' => 'Gemini 3.6 Flash (Recommended)',
            'gemini-3.5-flash-lite' => 'Gemini 3.5 Flash Lite (Fastest)',
        ],

        'timeout_seconds' => (int) env('GEMINI_TIMEOUT_SECONDS', 120),
        'connect_timeout_seconds' => 10,
        'test_timeout_seconds' => (int) env('GEMINI_TEST_TIMEOUT_SECONDS', 60),
        'max_prompt_length' => 2000,
        'max_response_bytes' => 131072,
        'max_output_tokens' => 16384,
        'max_blocks' => 30,
        'max_top_level_blocks' => 8,

        /*
        | Gemini 3 Flash models default to medium thinking, which can make a
        | structured generation request exceed a normal request timeout.
        | Keep thinking low for fast, deterministic builder responses.
        |
        | @var array<string, string>
        */
        'thinking_levels' => [
            'gemini-3.6-flash' => 'low',
            'gemini-3.5-flash-lite' => 'minimal',
        ],
        'default_thinking_level' => env('GEMINI_THINKING_LEVEL', 'low'),
    ],

];
