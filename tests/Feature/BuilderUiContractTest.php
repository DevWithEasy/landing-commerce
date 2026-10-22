<?php

declare(strict_types=1);

use Illuminate\Support\Str;

/**
 * These are source-level contracts for builder UI wiring that cannot be
 * exercised without a browser. They intentionally avoid database access.
 */
test('builder palette renders compact horizontal icon-left rows', function () {
    $source = file_get_contents(resource_path('js/Builder/components/LeftSidebar.tsx'));

    expect($source)
        ->toContain('grid grid-cols-1 gap-1')
        ->toContain('flex-row items-center gap-2')
        ->toContain('min-w-0 flex-1 truncate')
        ->not->toContain('flex-col items-start gap-1');
});

test('react blocks and published blade blocks expose identical inner element hooks', function () {
    $reactBlocks = glob(resource_path('js/Builder/blocks/*Block.tsx'));

    expect($reactBlocks)->not->toBeEmpty();

    foreach ($reactBlocks as $reactPath) {
        $fileName = basename($reactPath);
        $viewName = Str::kebab(Str::replaceLast('Block.tsx', '', $fileName));
        $bladePath = resource_path("views/builder/blocks/{$viewName}.blade.php");

        expect($bladePath)->toBeFile();

        preg_match_all('/data-lc-el="([^"]+)"/', (string) file_get_contents($reactPath), $reactMatches);
        preg_match_all('/data-lc-el="([^"]+)"/', (string) file_get_contents($bladePath), $bladeMatches);

        $reactKeys = array_values(array_unique($reactMatches[1]));
        $bladeKeys = array_values(array_unique($bladeMatches[1]));

        sort($reactKeys);
        sort($bladeKeys);

        expect($bladeKeys)->toBe(
            $reactKeys,
            "Blade element hooks for {$fileName} must match the React block hooks."
        );
    }
});

test('every published blade block exposes a responsive root hook', function () {
    $bladeBlocks = glob(resource_path('views/builder/blocks/*.blade.php'));

    expect($bladeBlocks)->toHaveCount(20);

    foreach ($bladeBlocks as $bladePath) {
        $source = (string) file_get_contents($bladePath);

        expect($source)
            ->toContain('lc-block-root')
            ->toContain('data-lc-el="');
    }
});
