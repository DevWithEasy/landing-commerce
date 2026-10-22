@php
    $safeCss = static function ($value): ?string {
        if (! is_string($value) && ! is_numeric($value)) {
            return null;
        }

        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        if (preg_match('/(?:expression\s*\(|@import|url\s*\(|javascript\s*:|behavior\s*:|-moz-binding|[;{}<>\\\\])/i', $value)) {
            return null;
        }

        return $value;
    };

    $inlineStyle = static function (array $declarations) use ($safeCss): string {
        $parts = [];

        foreach ($declarations as $property => $value) {
            $safeValue = $safeCss($value);

            if ($safeValue !== null) {
                $parts[] = $property.': '.$safeValue;
            }
        }

        return $parts === [] ? '' : 'style="'.e(implode('; ', $parts)).'"';
    };

    $clampColumns = static function ($value, int $fallback): int {
        if (! is_numeric($value)) {
            return $fallback;
        }

        return max(1, min(6, (int) round((float) $value)));
    };

    $columns = $clampColumns($props['columns'] ?? 3, 3);
    $tabletColumns = $clampColumns($props['tabletColumns'] ?? min($columns, 2), min($columns, 2));
    $mobileColumns = $clampColumns($props['mobileColumns'] ?? 1, 1);

    $columnGap = $safeCss($props['columnGap'] ?? '16px') ?: '16px';
    $rowGap = $safeCss($props['rowGap'] ?? '16px') ?: '16px';
    $allowedAlign = ['stretch', 'start', 'center', 'end'];
    $alignItems = in_array($props['alignItems'] ?? 'stretch', $allowedAlign, true) ? $props['alignItems'] : 'stretch';
    $justifyItems = in_array($props['justifyItems'] ?? 'stretch', $allowedAlign, true) ? $props['justifyItems'] : 'stretch';

    $scope = 'lc-grid-'.preg_replace('/[^a-zA-Z0-9_-]/', '_', (string) ($id ?? 'block'));
    $containerScope = $scope.'-container';

    $gridStyle = $inlineStyle([
        'column-gap' => $columnGap,
        'row-gap' => $rowGap,
        'align-items' => $alignItems,
        'justify-items' => $justifyItems,
    ]);
@endphp

<style>
    .{{ $containerScope }} {
        container-type: inline-size;
    }

    .{{ $scope }} {
        display: grid;
        grid-template-columns: repeat({{ $columns }}, minmax(0, 1fr));
    }

    @container (max-width: 1024px) {
        .{{ $scope }} {
            grid-template-columns: repeat({{ $tabletColumns }}, minmax(0, 1fr));
        }
    }

    @container (max-width: 640px) {
        .{{ $scope }} {
            grid-template-columns: repeat({{ $mobileColumns }}, minmax(0, 1fr));
        }
    }
</style>

<div id="{{ $id }}" {!! $styleAttribute !!} class="lc-block-root lc-grid-container {{ $containerScope }} w-full max-w-7xl mx-auto">
    <div class="{{ $scope }} lc-grid" {!! $gridStyle !!} data-lc-el="grid">
        {!! $childrenHtml !!}
    </div>
</div>
