<?php

declare(strict_types=1);

namespace App\Modules\Orders\Services;

/**
 * Pure PHP Code 128 (Subset B) SVG Barcode Generator.
 *
 * Generates lightweight, crisp vector SVG barcodes with zero external runtime dependencies.
 * Perfect for 80mm thermal POS receipts and A4 packing slips.
 */
class BarcodeGeneratorService
{
    /**
     * Code 128 pattern definitions (value 0 to 106).
     * Each pattern represents the bar/space widths (sum of digits = 11 modules, stop character = 13 modules).
     *
     * @var list<string>
     */
    private const PATTERNS = [
        '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
        '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
        '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
        '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
        '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
        '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
        '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
        '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
        '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
        '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
        '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
    ];

    private const START_B = 104;

    private const STOP = 106;

    /**
     * Generate an SVG barcode for the given alphanumeric code (Code 128B).
     *
     * @param  string  $code  The text to encode (e.g. order number)
     * @param  int  $height  Height of the barcode in px (default 50)
     * @param  int  $moduleWidth  Width of a single module in px (default 2)
     * @param  bool  $showText  Whether to show human-readable text under bars
     */
    public function generateSvg(
        string $code,
        int $height = 50,
        int $moduleWidth = 2,
        bool $showText = true
    ): string {
        $cleanCode = trim($code);
        if ($cleanCode === '') {
            $cleanCode = 'UNKNOWN';
        }

        // Calculate values and checksum
        $values = [self::START_B];
        $checkSum = self::START_B;

        $len = strlen($cleanCode);
        for ($i = 0; $i < $len; $i++) {
            $char = $cleanCode[$i];
            $ascii = ord($char);
            // In Code 128B, value = ascii - 32 for printable ASCII 32..127
            $val = max(0, min(95, $ascii - 32));
            $values[] = $val;
            $checkSum += $val * ($i + 1);
        }

        $values[] = $checkSum % 103;
        $values[] = self::STOP;

        // Build module sequence (1 = bar, 0 = space)
        $modules = '';
        foreach ($values as $val) {
            $pattern = self::PATTERNS[$val] ?? self::PATTERNS[0];
            $isBar = true;
            $patternLen = strlen($pattern);
            for ($p = 0; $p < $patternLen; $p++) {
                $count = (int) $pattern[$p];
                $modules .= str_repeat($isBar ? '1' : '0', $count);
                $isBar = ! $isBar;
            }
        }

        // Quiet zone modules on both sides
        $quietZone = 10;
        $totalModules = strlen($modules) + ($quietZone * 2);
        $totalWidth = $totalModules * $moduleWidth;
        $totalHeight = $showText ? $height + 18 : $height;

        // Build SVG rectangles for each bar
        $rects = [];
        $currentX = $quietZone * $moduleWidth;
        $inBar = false;
        $barStart = 0;

        $modCount = strlen($modules);
        for ($m = 0; $m < $modCount; $m++) {
            if ($modules[$m] === '1') {
                if (! $inBar) {
                    $inBar = true;
                    $barStart = $currentX;
                }
            } else {
                if ($inBar) {
                    $barWidth = $currentX - $barStart;
                    $rects[] = sprintf(
                        '<rect x="%d" y="0" width="%d" height="%d" fill="#000000"/>',
                        $barStart,
                        $barWidth,
                        $height
                    );
                    $inBar = false;
                }
            }
            $currentX += $moduleWidth;
        }

        if ($inBar) {
            $barWidth = $currentX - $barStart;
            $rects[] = sprintf(
                '<rect x="%d" y="0" width="%d" height="%d" fill="#000000"/>',
                $barStart,
                $barWidth,
                $height
            );
        }

        $textElement = '';
        if ($showText) {
            $textY = $height + 14;
            $escaped = htmlspecialchars($cleanCode, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $textElement = sprintf(
                '<text x="%d" y="%d" text-anchor="middle" font-family="monospace, monospace" font-size="12" font-weight="600" fill="#111827" letter-spacing="1">%s</text>',
                (int) ($totalWidth / 2),
                $textY,
                $escaped
            );
        }

        return sprintf(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" class="barcode-svg" role="img" aria-label="Barcode: %s"><rect width="100%%" height="100%%" fill="#ffffff"/>%s%s</svg>',
            $totalWidth,
            $totalHeight,
            $totalWidth,
            $totalHeight,
            htmlspecialchars($cleanCode, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'),
            implode('', $rects),
            $textElement
        );
    }
}
