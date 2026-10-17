<?php

declare(strict_types=1);

namespace App\Modules\Checkout\Models;

use Illuminate\Database\Eloquent\Model;

class PhoneBlacklist extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'phone',
        'reason',
    ];
}
