<?php

declare(strict_types=1);

use App\Modules\PageBuilder\Services\PageAstValidator;
use Illuminate\Validation\ValidationException;

beforeEach(function () {
    $this->validator = app(PageAstValidator::class);
});

function responsiveStyleAst(array $styles): array
{
    return [
        'version' => 1,
        'blocks' => [
            [
                'id' => 'style-block-1',
                'type' => 'HeroBlock',
                'props' => [
                    'headline' => 'Responsive Hero',
                    'ctaText' => 'Order Now',
                    'ctaTarget' => '#cod-checkout',
                ],
                'styles' => $styles,
            ],
        ],
    ];
}

test('validator accepts responsive overrides, element styles and block geometry', function () {
    $ast = responsiveStyleAst([
        'width' => '80%',
        'selfAlign' => 'center',
        'responsive' => [
            'tablet' => ['fontSize' => '36px'],
            'mobile' => ['fontSize' => '24px', 'width' => '100%'],
        ],
        'elements' => [
            'title' => [
                'color' => '#b91c1c',
                'fontSize' => '48px',
                'responsive' => [
                    'mobile' => ['fontSize' => '30px'],
                ],
            ],
            'cta' => [
                'backgroundColor' => '#16a34a',
                'borderRadius' => '14px',
            ],
        ],
    ]);

    $validated = $this->validator->validate($ast);

    expect($validated['blocks'][0]['styles']['elements']['title']['color'])->toBe('#b91c1c');
});

test('validator rejects unsafe css inside inner element styles', function () {
    $ast = responsiveStyleAst([
        'elements' => [
            'title' => [
                'color' => 'url(https://evil.test/payload.css)',
            ],
        ],
    ]);

    try {
        $this->validator->validate($ast);
        $this->fail('Unsafe inner element CSS should have been rejected.');
    } catch (ValidationException $exception) {
        expect($exception->errors())->toHaveKey('blocks.0.styles.elements.title.color');
    }
});

test('validator rejects element maps nested inside responsive overrides', function () {
    $ast = responsiveStyleAst([
        'responsive' => [
            'mobile' => [
                'elements' => [
                    'title' => ['color' => '#ffffff'],
                ],
            ],
        ],
    ]);

    try {
        $this->validator->validate($ast);
        $this->fail('Nested responsive element maps should have been rejected.');
    } catch (ValidationException $exception) {
        expect($exception->errors())->toHaveKey('blocks.0.styles.responsive.mobile.elements');
    }
});

test('validator rejects element maps nested inside another element style', function () {
    $ast = responsiveStyleAst([
        'elements' => [
            'title' => [
                'elements' => [
                    'cta' => ['color' => '#ffffff'],
                ],
            ],
        ],
    ]);

    try {
        $this->validator->validate($ast);
        $this->fail('Nested element maps should have been rejected.');
    } catch (ValidationException $exception) {
        expect($exception->errors())->toHaveKey('blocks.0.styles.elements.title.elements');
    }
});

test('validator rejects invalid block alignment and unsafe overlay positioning', function () {
    $invalidAlignment = responsiveStyleAst(['selfAlign' => 'absolute']);

    try {
        $this->validator->validate($invalidAlignment);
        $this->fail('Invalid self alignment should have been rejected.');
    } catch (ValidationException $exception) {
        expect($exception->errors())->toHaveKey('blocks.0.styles.selfAlign');
    }

    $fixedHero = responsiveStyleAst(['position' => 'fixed']);

    try {
        $this->validator->validate($fixedHero);
        $this->fail('Fixed positioning on a HeroBlock should have been rejected.');
    } catch (ValidationException $exception) {
        expect($exception->errors())->toHaveKey('blocks.0.styles.position');
    }
});
