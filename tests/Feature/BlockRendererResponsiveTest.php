<?php

declare(strict_types=1);

use App\Modules\PageBuilder\Services\BlockRendererService;

beforeEach(function () {
    $this->renderer = app(BlockRendererService::class);
});

test('responsive styles, element styles and block alignment are scoped in published output', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'responsive-1',
        'type' => 'HeadingBlock',
        'props' => [
            'text' => 'Responsive Heading',
            'tag' => 'h2',
        ],
        'styles' => [
            'color' => '#111111',
            'fontSize' => '48px',
            'width' => '80%',
            'selfAlign' => 'center',
            'responsive' => [
                'tablet' => ['fontSize' => '36px'],
                'mobile' => ['fontSize' => '24px', 'width' => '100%'],
            ],
            'elements' => [
                'title' => [
                    'color' => '#ff0000',
                    'fontSize' => '52px',
                    'responsive' => [
                        'tablet' => ['fontSize' => '40px'],
                        'mobile' => ['fontSize' => '28px'],
                    ],
                ],
            ],
        ],
    ]);

    expect($html)
        ->toContain('data-lc-block-scope="lc-scope-responsive-1"')
        ->toContain('data-lc-block-id="responsive-1"')
        ->toContain('style="width: 80%; margin-left: auto; margin-right: auto"')
        ->toContain('data-lc-el="title"')
        ->toContain('[data-lc-block-scope="lc-scope-responsive-1"] [data-lc-el="title"] { color: #ff0000 !important;')
        ->toContain('@media (max-width: 1024px) { [data-lc-block-scope="lc-scope-responsive-1"] [data-lc-el="title"] { font-size: 40px !important; } }')
        ->toContain('@media (max-width: 767px) { [data-lc-block-scope="lc-scope-responsive-1"] > .lc-block-root { font-size: 24px !important; } }')
        ->toContain('@media (max-width: 767px) { [data-lc-block-scope="lc-scope-responsive-1"] { width: 100% !important; } }');
});

test('renderer drops unsafe element css and overlay positioning even without validation', function () {
    $html = $this->renderer->renderBlock([
        'id' => 'unsafe-styles',
        'type' => 'HeadingBlock',
        'props' => [
            'text' => 'Safe Heading',
            'tag' => 'h2',
        ],
        'styles' => [
            'position' => 'fixed',
            'zIndex' => 9999,
            'elements' => [
                'title' => [
                    'width' => '50%',
                    'color' => 'url(https://evil.test/payload.css)',
                    'position' => 'fixed',
                    'zIndex' => 9999,
                    'backgroundColor' => 'red; display: none',
                ],
            ],
        ],
    ]);

    expect($html)
        ->toContain('[data-lc-block-scope="lc-scope-unsafe-styles"] [data-lc-el="title"] { width: 50% !important; }')
        ->not->toContain('url(')
        ->not->toContain('position: fixed')
        ->not->toContain('z-index')
        ->not->toContain('display: none')
        ->not->toContain('red;');
});

test('inline style conversion rejects statement injection and unsafe css values', function () {
    $css = $this->renderer->convertStylesToCssAttribute([
        'backgroundColor' => '#ffffff',
        'color' => 'blue; font-size: 500px',
        'backgroundImage' => 'url(javascript:alert(1))',
        'fontFamily' => 'Inter, sans-serif',
        'position' => 'fixed',
        'zIndex' => 9999,
    ]);

    expect($css)
        ->toContain('background-color: #ffffff')
        ->toContain('font-family: Inter, sans-serif')
        ->not->toContain('blue')
        ->not->toContain('font-size: 500px')
        ->not->toContain('url(')
        ->not->toContain('position: fixed')
        ->not->toContain('z-index');
});
