<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Services;

class BlockRegistry
{
    /**
     * Complete list of registered and approved block types.
     * Any block type outside this registry is strictly prohibited.
     *
     * @var list<string>
     */
    public const APPROVED_BLOCKS = [
        'HeroBlock',
        'ProductSelectorBlock',
        'CodCheckoutBlock',
        'BenefitsGridBlock',
        'ReviewsBlock',
        'VideoBlock',
        'FaqBlock',
        'CountdownTimerBlock',
        'StickyBarBlock',
    ];

    /**
     * Check if a block type is in the approved allowlist.
     */
    public static function isApproved(string $blockType): bool
    {
        return in_array($blockType, self::APPROVED_BLOCKS, true);
    }

    /**
     * Get the full list of approved block types.
     *
     * @return list<string>
     */
    public static function getApprovedBlocks(): array
    {
        return self::APPROVED_BLOCKS;
    }
}
