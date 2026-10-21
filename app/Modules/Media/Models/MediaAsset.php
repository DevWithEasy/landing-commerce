<?php

declare(strict_types=1);

namespace App\Modules\Media\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class MediaAsset extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'file_path',
        'original_name',
        'mime_type',
        'size_bytes',
        'width',
        'height',
        'alt_text',
        'uploaded_by',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'url',
        'thumb_url',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->file_path);
    }

    public function getThumbUrlAttribute(): string
    {
        $path = $this->file_path;
        $extension = pathinfo($path, PATHINFO_EXTENSION);

        if ($extension !== '') {
            $base = substr($path, 0, -(strlen($extension) + 1));
            $thumbPath = "{$base}-thumb.{$extension}";

            if (Storage::disk('public')->exists($thumbPath)) {
                return Storage::disk('public')->url($thumbPath);
            }
        }

        return $this->getUrlAttribute();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
