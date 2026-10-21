<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\PageBuilder\Models\LandingPage;
use App\Modules\PageBuilder\Models\LandingPageRevision;
use App\Modules\Settings\Models\Setting;
use App\Modules\Settings\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function aiTestConfigure(
    string $apiKey = 'AIzaSy_TEST_SECRET_KEY_123',
    string $model = 'gemini-3.6-flash',
    bool $enabled = true
): void {
    $settings = app(SettingsService::class);
    $settings->set('ai.gemini.api_key', $apiKey, 'ai', true);
    $settings->set('ai.gemini.model', $model, 'ai', false);
    $settings->set('ai.gemini.enabled', $enabled ? '1' : '0', 'ai', false);
}

/**
 * @param  array<string, mixed>  $payload
 * @return array<string, mixed>
 */
function aiTestGeminiPayload(array $payload): array
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
function aiTestGeminiBody(
    string $html,
    string $css,
    string $summary = 'A safe generated design.'
): array {
    return aiTestGeminiPayload([
        'summary' => $summary,
        'html' => $html,
        'css' => $css,
    ]);
}

/**
 * @return array{html: string, css: string}
 */
function aiTestValidDesign(): array
{
    return [
        'html' => '<section class="hero"><div class="hero-inner"><p class="eyebrow">New collection</p><h1>Premium everyday comfort</h1><p class="lead">Nationwide cash on delivery.</p><a class="cta" href="#cod-checkout">Order now</a></div></section>',
        'css' => '.hero { padding: 64px 24px; background: linear-gradient(135deg, #f8fafc, #dcfce7); } .hero-inner { max-width: 1120px; margin: 0 auto; text-align: center; } .eyebrow { color: #16a34a; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; } .hero h1 { color: #0f172a; font-size: clamp(2rem, 5vw, 4rem); line-height: 1.05; margin: 12px 0; } .lead { color: #475569; font-size: 1.125rem; margin-bottom: 28px; } .cta { display: inline-block; background: #16a34a; color: #fff; padding: 14px 28px; border-radius: 999px; font-weight: 700; text-decoration: none; } @media (max-width: 640px) { .hero { padding: 40px 16px; } }',
    ];
}

beforeEach(function () {
    $this->superAdmin = User::factory()->create([
        'name' => 'AI Super Admin',
        'email' => 'ai-super-'.uniqid().'@example.com',
        'role' => 'super_admin',
    ]);

    $this->storeManager = User::factory()->create([
        'name' => 'AI Store Manager',
        'email' => 'ai-manager-'.uniqid().'@example.com',
        'role' => 'store_manager',
    ]);

    $this->fulfillmentAgent = User::factory()->create([
        'name' => 'AI Fulfillment Agent',
        'email' => 'ai-agent-'.uniqid().'@example.com',
        'role' => 'fulfillment_agent',
    ]);

    $this->landingPage = LandingPage::create([
        'title' => 'AI Generated Campaign',
        'slug' => 'ai-generated-campaign-'.uniqid(),
        'status' => 'draft',
    ]);
});

test('AI management and generation endpoints enforce authorization', function () {
    Http::fake();

    $payload = [
        'prompt' => 'Create a premium hero section with a heading, image, and COD button.',
        'landing_page_id' => $this->landingPage->id,
    ];

    $guestResponse = $this->postJson(route('admin.ai.generate-design'), $payload);
    expect($guestResponse->status())->toBeIn([401, 302]);

    $this->actingAs($this->fulfillmentAgent)
        ->postJson(route('admin.ai.generate-design'), $payload)
        ->assertForbidden();

    $this->actingAs($this->storeManager)
        ->postJson(route('admin.ai.test-connection'), [
            'model' => 'gemini-3.6-flash',
        ])
        ->assertForbidden();

    $this->actingAs($this->storeManager)
        ->delete(route('admin.ai.key.destroy'))
        ->assertForbidden();

    $this->actingAs($this->storeManager)
        ->post(route('admin.settings.update'), [
            'ai_gemini_api_key' => 'AIzaSy_SHOULD_NOT_SAVE',
        ])
        ->assertForbidden();

    Http::assertNothingSent();
});

test('AI key is encrypted at rest, masked in Inertia props, and preserved when masked', function () {
    $secret = 'AIzaSy_SETTINGS_SECRET_987654321';
    $settings = app(SettingsService::class);

    $this->actingAs($this->superAdmin)
        ->post(route('admin.settings.update'), [
            'ai_gemini_api_key' => $secret,
            'ai_model' => 'gemini-3.6-flash',
            'ai_enabled' => '1',
        ])
        ->assertRedirect(route('admin.settings.index'))
        ->assertSessionHas('success');

    $rawSetting = DB::table('settings')->where('key', 'ai.gemini.api_key')->first();
    expect($rawSetting)->not->toBeNull()
        ->and($rawSetting->value)->not->toBe($secret)
        ->and((bool) $rawSetting->is_encrypted)->toBeTrue()
        ->and($settings->get('ai.gemini.api_key'))->toBe($secret);

    $response = $this->actingAs($this->superAdmin)
        ->get(route('admin.settings.index'));

    $response->assertOk()
        ->assertDontSee($secret)
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Settings/Index')
            ->where('settings.ai_gemini_api_key', SettingsService::SECRET_MASK)
            ->where('settings.ai_gemini_api_key_configured', true)
            ->where('settings.ai_model', 'gemini-3.6-flash')
            ->where('settings.ai_enabled', '1')
            ->has('aiModels')
            ->etc()
        );

    $this->actingAs($this->superAdmin)
        ->post(route('admin.settings.update'), [
            'ai_gemini_api_key' => SettingsService::SECRET_MASK,
            'ai_model' => 'gemini-3.5-flash-lite',
            'ai_enabled' => '0',
        ])
        ->assertRedirect(route('admin.settings.index'));

    expect($settings->get('ai.gemini.api_key'))->toBe($secret)
        ->and($settings->get('ai.gemini.model'))->toBe('gemini-3.5-flash-lite')
        ->and($settings->get('ai.gemini.enabled'))->toBe('0');

    $this->actingAs($this->superAdmin)
        ->post(route('admin.settings.update'), [
            'ai_gemini_api_key' => '',
            'ai_model' => 'gemini-3.6-flash',
            'ai_enabled' => '1',
        ])
        ->assertRedirect(route('admin.settings.index'));

    expect($settings->get('ai.gemini.api_key'))->toBe($secret);
});

test('invalid AI model settings are rejected without changing the saved model', function () {
    aiTestConfigure();

    $this->actingAs($this->superAdmin)
        ->from(route('admin.settings.index'))
        ->post(route('admin.settings.update'), [
            'ai_model' => 'gemini-untrusted-model',
            'ai_enabled' => '1',
        ])
        ->assertRedirect(route('admin.settings.index'))
        ->assertSessionHasErrors('ai_model');

    expect(app(SettingsService::class)->get('ai.gemini.model'))->toBe('gemini-3.6-flash');
});

test('explicit key removal clears only the encrypted key and leaves pages untouched', function () {
    aiTestConfigure();

    $revision = LandingPageRevision::create([
        'landing_page_id' => $this->landingPage->id,
        'revision_number' => 1,
        'ast_content' => ['version' => 1, 'blocks' => []],
        'created_by' => 'Test Suite',
    ]);

    $this->landingPage->update(['published_revision_id' => $revision->id]);

    $this->from(route('admin.settings.index'))
        ->actingAs($this->superAdmin)
        ->delete(route('admin.ai.key.destroy'))
        ->assertRedirect(route('admin.settings.index'))
        ->assertSessionHas('success');

    expect(Setting::query()->where('key', 'ai.gemini.api_key')->exists())->toBeFalse()
        ->and($this->landingPage->fresh())->not->toBeNull()
        ->and($this->landingPage->fresh()->published_revision_id)->toBe($revision->id)
        ->and($this->landingPage->revisions()->count())->toBe(1);
});

test('generation is rejected when the key is missing or AI is disabled without calling Gemini', function () {
    Http::fake();

    $payload = [
        'prompt' => 'Create a premium hero section with a heading, image, and COD button.',
        'landing_page_id' => $this->landingPage->id,
    ];

    $missingKey = $this->actingAs($this->storeManager)
        ->postJson(route('admin.ai.generate-design'), $payload)
        ->assertStatus(422)
        ->assertJson(['success' => false]);

    expect((string) $missingKey->json('message'))->toContain('not configured');

    aiTestConfigure(enabled: false);

    $disabled = $this->actingAs($this->storeManager)
        ->postJson(route('admin.ai.generate-design'), $payload)
        ->assertStatus(422)
        ->assertJson(['success' => false]);

    expect((string) $disabled->json('message'))->toContain('disabled');

    Http::assertNothingSent();
});

test('valid mocked Gemini output becomes one sanitized Custom HTML block', function () {
    $secret = 'AIzaSy_GENERATE_SECRET_123456';
    aiTestConfigure($secret);

    $design = aiTestValidDesign();
    $revisionCountBefore = $this->landingPage->revisions()->count();

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/*' => Http::response(
            aiTestGeminiBody($design['html'], $design['css']),
            200
        ),
    ]);

    $response = $this->actingAs($this->storeManager)
        ->postJson(route('admin.ai.generate-design'), [
            'prompt' => 'Create a premium hero section for an Eid clothing collection with a heading, text, image, and COD button.',
            'landing_page_id' => $this->landingPage->id,
        ])
        ->assertOk()
        ->assertJson(['success' => true]);

    $blocks = $response->json('blocks');

    expect($blocks)->toBeArray()->toHaveCount(1)
        ->and($blocks[0]['type'])->toBe('HtmlBlock')
        ->and($blocks[0]['id'])->toStartWith('blk_ai_')
        ->and($blocks[0]['props']['html'])->toContain('class="ai-design-')
        ->and($blocks[0]['props']['html'])->toContain('Premium everyday comfort')
        ->and($blocks[0]['props']['html'])->toContain('href="#cod-checkout"')
        ->and($blocks[0]['props']['css'])->toContain('.ai-design-')
        ->and($blocks[0]['props']['css'])->toContain('.hero {')
        ->and($blocks[0]['props']['css'])->toContain('@media (max-width: 640px) {');

    expect($response->getContent())->not->toContain($secret)
        ->and($this->landingPage->revisions()->count())->toBe($revisionCountBefore);

    Http::assertSent(function (ClientRequest $request) use ($secret): bool {
        $data = $request->data();

        return str_contains($request->url(), '/models/gemini-3.6-flash:generateContent')
            && ! str_contains($request->url(), $secret)
            && $request->hasHeader('x-goog-api-key', $secret)
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

test('generated HtmlBlock is accepted by the existing revision AST validator', function () {
    aiTestConfigure();

    $design = aiTestValidDesign();

    Http::fake([
        '*' => Http::response(aiTestGeminiBody($design['html'], $design['css']), 200),
    ]);

    $generated = $this->actingAs($this->storeManager)
        ->postJson(route('admin.ai.generate-design'), [
            'prompt' => 'Create a premium hero section with a heading, text, image, and COD button.',
            'landing_page_id' => $this->landingPage->id,
        ])
        ->assertOk()
        ->json('blocks');

    $this->actingAs($this->storeManager)
        ->postJson(route('admin.landing-pages.revisions.store', $this->landingPage), [
            'version' => 1,
            'blocks' => $generated,
        ])
        ->assertCreated()
        ->assertJson(['success' => true]);

    $latest = $this->landingPage->revisions()->first();
    expect($latest)->not->toBeNull()
        ->and($latest->ast_content['blocks'][0]['type'])->toBe('HtmlBlock')
        ->and($latest->ast_content['blocks'][0]['id'])->toStartWith('blk_ai_')
        ->and($latest->ast_content['blocks'][0]['props']['html'])->toContain('ai-design-');
});

test('malformed Gemini JSON is rejected safely and does not mutate pages', function () {
    aiTestConfigure();

    $revision = LandingPageRevision::create([
        'landing_page_id' => $this->landingPage->id,
        'revision_number' => 1,
        'ast_content' => ['version' => 1, 'blocks' => []],
        'created_by' => 'Test Suite',
    ]);

    Http::fake([
        '*' => Http::response([
            'candidates' => [
                [
                    'finishReason' => 'STOP',
                    'content' => ['parts' => [['text' => 'this is not json {']]],
                ],
            ],
        ], 200),
    ]);

    $response = $this->actingAs($this->storeManager)
        ->postJson(route('admin.ai.generate-design'), [
            'prompt' => 'Create a hero section with a heading and text.',
            'landing_page_id' => $this->landingPage->id,
        ])
        ->assertStatus(422)
        ->assertJson(['success' => false]);

    expect((string) $response->json('message'))->toContain('invalid design')
        ->and($this->landingPage->revisions()->count())->toBe(1)
        ->and($this->landingPage->revisions()->first()?->id)->toBe($revision->id);
});

test('unsafe AI HTML and CSS are rejected before preview', function () {
    aiTestConfigure();

    $safeHtml = '<section class="safe"><h1>Safe design</h1></section>';
    $safeCss = '.safe { color: #111111; }';

    $payloads = [
        // Script tag.
        ['html' => '<div><script>alert(1)</script></div>', 'css' => $safeCss],
        // Inline event handler.
        ['html' => '<img src="https://example.com/a.jpg" onerror="alert(1)">', 'css' => $safeCss],
        // JavaScript URL.
        ['html' => '<a href="javascript:alert(1)">Click</a>', 'css' => $safeCss],
        // Inline style.
        ['html' => '<div style="color:red">Unsafe</div>', 'css' => $safeCss],
        // Unsafe CSS import.
        ['html' => $safeHtml, 'css' => '@import url(https://evil.test/a.css);'],
        // Fixed overlay.
        ['html' => $safeHtml, 'css' => '.safe { position: fixed; inset: 0; }'],
    ];

    $sequence = Http::fakeSequence();
    foreach ($payloads as $payload) {
        $sequence->push(aiTestGeminiPayload($payload), 200);
    }

    foreach ($payloads as $index => $payload) {
        $response = $this->actingAs($this->storeManager)
            ->postJson(route('admin.ai.generate-design'), [
                'prompt' => 'Create a safe hero section number '.$index.' with a heading.',
                'landing_page_id' => $this->landingPage->id,
            ])
            ->assertStatus(422)
            ->assertJson(['success' => false]);

        expect((string) $response->json('message'))->toContain('unsupported or unsafe');
    }
});

test('excessive HTML/CSS size, excessive nesting, and oversized responses are rejected', function () {
    aiTestConfigure();

    $safeHtml = '<section class="safe"><h1>Safe</h1></section>';
    $safeCss = '.safe { color: #111111; }';

    $tooLargeHtml = '<div class="safe">'.str_repeat('A', 80_001).'</div>';
    $tooLargeCss = str_repeat('.safe { color: #111111; }', 2_000);
    $tooDeep = '<div>'.str_repeat('<div>', 25).'Deep'.str_repeat('</div>', 25).'</div>';

    $sequence = Http::fakeSequence()
        ->push(aiTestGeminiBody($tooLargeHtml, $safeCss), 200)
        ->push(aiTestGeminiBody($safeHtml, $tooLargeCss), 200)
        ->push(aiTestGeminiBody($tooDeep, $safeCss), 200)
        ->push([
            'candidates' => [
                [
                    'finishReason' => 'STOP',
                    'content' => [
                        'parts' => [
                            ['text' => str_repeat('x', 140000)],
                        ],
                    ],
                ],
            ],
        ], 200);

    $responses = [];
    for ($attempt = 0; $attempt < 4; $attempt++) {
        $responses[] = $this->actingAs($this->storeManager)
            ->postJson(route('admin.ai.generate-design'), [
                'prompt' => 'Create a safe hero section attempt '.$attempt.'.',
                'landing_page_id' => $this->landingPage->id,
            ]);
    }

    foreach ($responses as $response) {
        $response->assertStatus(422)->assertJson(['success' => false]);
    }
});

test('upstream Gemini failures map to safe customer-facing errors', function () {
    aiTestConfigure();

    Http::fakeSequence()
        ->push(['error' => ['message' => 'raw upstream invalid key detail']], 403)
        ->push(['error' => ['message' => 'raw upstream quota detail']], 429)
        ->push(['error' => ['message' => 'raw upstream stack trace']], 500);

    $invalidKey = $this->actingAs($this->storeManager)
        ->postJson(route('admin.ai.generate-design'), [
            'prompt' => 'Create a premium hero section with a heading.',
            'landing_page_id' => $this->landingPage->id,
        ])
        ->assertStatus(422)
        ->assertJson(['success' => false]);

    expect((string) $invalidKey->json('message'))->toContain('rejected the API key')
        ->and($invalidKey->getContent())->not->toContain('raw upstream invalid key detail');

    $quota = $this->actingAs($this->storeManager)
        ->postJson(route('admin.ai.generate-design'), [
            'prompt' => 'Create a premium hero section with a heading.',
            'landing_page_id' => $this->landingPage->id,
        ])
        ->assertStatus(429)
        ->assertJson(['success' => false]);

    expect((string) $quota->json('message'))->toContain('quota or rate limit')
        ->and($quota->getContent())->not->toContain('raw upstream quota detail');

    $upstream = $this->actingAs($this->storeManager)
        ->postJson(route('admin.ai.generate-design'), [
            'prompt' => 'Create a premium hero section with a heading.',
            'landing_page_id' => $this->landingPage->id,
        ])
        ->assertStatus(502)
        ->assertJson(['success' => false]);

    expect((string) $upstream->json('message'))->toContain('temporarily unavailable')
        ->and($upstream->getContent())->not->toContain('raw upstream stack trace');
});

test('Gemini connection failures map to a safe timeout error', function () {
    aiTestConfigure();

    Http::fake([
        '*' => function () {
            throw new ConnectionException('Connection timed out with secret AIzaSy_RAW');
        },
    ]);

    $response = $this->actingAs($this->storeManager)
        ->postJson(route('admin.ai.generate-design'), [
            'prompt' => 'Create a premium hero section with a heading.',
            'landing_page_id' => $this->landingPage->id,
        ])
        ->assertStatus(504)
        ->assertJson(['success' => false]);

    expect((string) $response->json('message'))->toContain('timed out')
        ->and($response->getContent())->not->toContain('AIzaSy_RAW');
});

test('AI generation is rate limited per authenticated user', function () {
    aiTestConfigure();

    $design = aiTestValidDesign();

    Http::fake([
        '*' => Http::response(aiTestGeminiBody($design['html'], $design['css']), 200),
    ]);

    $statuses = [];
    for ($attempt = 0; $attempt < 8; $attempt++) {
        $statuses[] = $this->actingAs($this->storeManager)
            ->postJson(route('admin.ai.generate-design'), [
                'prompt' => 'Create a premium hero section attempt '.$attempt.'.',
                'landing_page_id' => $this->landingPage->id,
            ])
            ->status();
    }

    expect(array_slice($statuses, 0, 6))->toBe([200, 200, 200, 200, 200, 200])
        ->and($statuses[6])->toBe(429)
        ->and($statuses[7])->toBe(429);
});

test('connection testing uses a real generation probe and never saves the entered key', function () {
    aiTestConfigure('AIzaSy_SAVED_KEY_123456');

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/*' => Http::response([
            'candidates' => [
                [
                    'finishReason' => 'STOP',
                    'content' => ['parts' => [['text' => 'OK']]],
                ],
            ],
        ], 200),
    ]);

    $this->actingAs($this->superAdmin)
        ->postJson(route('admin.ai.test-connection'), [
            'api_key' => '',
            'model' => 'gemini-3.6-flash',
        ])
        ->assertOk()
        ->assertJson(['success' => true]);

    Http::assertSent(function (ClientRequest $request): bool {
        $data = $request->data();

        return $request->method() === 'POST'
            && $request->hasHeader('x-goog-api-key', 'AIzaSy_SAVED_KEY_123456')
            && str_contains($request->url(), '/models/gemini-3.6-flash:generateContent')
            && ($data['generationConfig']['thinkingConfig']['thinkingLevel'] ?? null) === 'low'
            && ($data['generationConfig']['maxOutputTokens'] ?? null) === 1024;
    });

    Http::fake([
        '*' => Http::response([
            'candidates' => [
                [
                    'finishReason' => 'STOP',
                    'content' => ['parts' => [['text' => 'OK']]],
                ],
            ],
        ], 200),
    ]);

    $this->actingAs($this->superAdmin)
        ->postJson(route('admin.ai.test-connection'), [
            'api_key' => 'AIzaSy_ENTERED_BUT_NOT_SAVED',
            'model' => 'gemini-3.5-flash-lite',
        ])
        ->assertOk();

    Http::assertSent(function (ClientRequest $request): bool {
        $data = $request->data();

        return $request->method() === 'POST'
            && $request->hasHeader('x-goog-api-key', 'AIzaSy_ENTERED_BUT_NOT_SAVED')
            && str_contains($request->url(), '/models/gemini-3.5-flash-lite:generateContent')
            && ($data['generationConfig']['thinkingConfig']['thinkingLevel'] ?? null) === 'minimal';
    });

    expect(app(SettingsService::class)->get('ai.gemini.api_key'))->toBe('AIzaSy_SAVED_KEY_123456');
});

test('builder receives AI status without the saved API key', function () {
    $secret = 'AIzaSy_BUILDER_PROP_SECRET_123';
    aiTestConfigure($secret);

    $response = $this->actingAs($this->storeManager)
        ->get(route('admin.landing-pages.builder', $this->landingPage));

    $response->assertOk()
        ->assertDontSee($secret)
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Builder/Editor')
            ->where('ai.configured', true)
            ->where('ai.enabled', true)
            ->where('ai.model', 'gemini-3.6-flash')
            ->missing('ai.api_key')
            ->etc()
        );
});

test('removed saved models fall back to the working default everywhere', function () {
    aiTestConfigure(model: 'gemini-3.8-flash');

    $this->actingAs($this->superAdmin)
        ->get(route('admin.settings.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('settings.ai_model', 'gemini-3.6-flash')
            ->etc()
        );

    $this->actingAs($this->storeManager)
        ->get(route('admin.landing-pages.builder', $this->landingPage))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('ai.model', 'gemini-3.6-flash')
            ->etc()
        );

    $design = aiTestValidDesign();

    Http::fakeSequence()
        ->push([
            'candidates' => [
                [
                    'finishReason' => 'STOP',
                    'content' => ['parts' => [['text' => 'OK']]],
                ],
            ],
        ], 200)
        ->push(aiTestGeminiBody($design['html'], $design['css']), 200);

    $this->actingAs($this->superAdmin)
        ->postJson(route('admin.ai.test-connection'), [
            'model' => 'gemini-3.8-flash',
        ])
        ->assertOk();

    Http::assertSent(function (ClientRequest $request): bool {
        return $request->method() === 'POST'
            && str_contains($request->url(), '/models/gemini-3.6-flash:generateContent');
    });

    $this->actingAs($this->storeManager)
        ->postJson(route('admin.ai.generate-design'), [
            'prompt' => 'Create a premium hero section with a heading and COD button.',
            'landing_page_id' => $this->landingPage->id,
        ])
        ->assertOk()
        ->assertJson(['success' => true]);

    Http::assertSent(function (ClientRequest $request): bool {
        return $request->method() === 'POST'
            && str_contains($request->url(), '/models/gemini-3.6-flash:generateContent');
    });
});
