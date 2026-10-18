<?php

declare(strict_types=1);

namespace App\Modules\Settings\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Throwable;

class Setting extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'group',
        'key',
        'value',
        'is_encrypted',
        'description',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_encrypted' => 'boolean',
        ];
    }

    /**
     * Scope query to a specific group.
     *
     * @param  Builder<Setting>  $query
     * @return Builder<Setting>
     */
    public function scopeGroup(Builder $query, string $group): Builder
    {
        return $query->where('group', $group);
    }

    /**
     * Retrieve the plaintext/decrypted value.
     */
    public function getDecryptedValue(): ?string
    {
        if ($this->value === null || $this->value === '') {
            return $this->value;
        }

        if (! $this->is_encrypted) {
            return (string) $this->value;
        }

        try {
            return Crypt::decryptString($this->value);
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Set the value, optionally encrypting via Laravel encryption.
     */
    public function setEncryptedValue(?string $value, bool $encrypt = true): self
    {
        $this->is_encrypted = $encrypt;

        if ($value === null || $value === '') {
            $this->value = null;

            return $this;
        }

        if ($encrypt) {
            $this->value = Crypt::encryptString($value);
        } else {
            $this->value = $value;
        }

        return $this;
    }
}
