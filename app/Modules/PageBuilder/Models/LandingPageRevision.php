<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LandingPageRevision extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'landing_page_id',
        'revision_number',
        'ast_content',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'revision_number' => 'integer',
            'ast_content' => 'array',
        ];
    }

    /**
     * @return BelongsTo<LandingPage, $this>
     */
    public function landingPage(): BelongsTo
    {
        return $this->belongsTo(LandingPage::class);
    }
}
