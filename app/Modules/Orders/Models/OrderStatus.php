<?php

declare(strict_types=1);

namespace App\Modules\Orders\Models;

final class OrderStatus
{
    public const PENDING = 'pending';

    public const CONFIRMED = 'confirmed';

    public const PROCESSING = 'processing';

    public const HANDED_TO_COURIER = 'handed_to_courier';

    public const IN_TRANSIT = 'in_transit';

    public const DELIVERED = 'delivered';

    public const RETURNED = 'returned';

    public const CANCELLED = 'cancelled';

    public const SPAM = 'spam';

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return [
            self::PENDING,
            self::CONFIRMED,
            self::PROCESSING,
            self::HANDED_TO_COURIER,
            self::IN_TRANSIT,
            self::DELIVERED,
            self::RETURNED,
            self::CANCELLED,
            self::SPAM,
        ];
    }
}
