<?php

declare(strict_types=1);

namespace App\Modules\Backup\Exceptions;

use RuntimeException;
use Throwable;

class RestoreFailedException extends RuntimeException
{
    public function __construct(
        string $message,
        protected ?string $snapshotPath = null,
        protected ?string $failingStatement = null,
        ?Throwable $previous = null
    ) {
        $recoveryInfo = '';
        if ($this->snapshotPath !== null) {
            $recoveryInfo = "\n\n[RECOVERY SNAPSHOT AVAILABLE]\n".
                "A safety database snapshot was generated immediately before this restore attempt:\n".
                "Snapshot File: {$this->snapshotPath}\n\n".
                "To restore your database to the state prior to this attempt, run:\n".
                'php artisan commerce:restore '.basename($this->snapshotPath);
        }

        parent::__construct($message.$recoveryInfo, 0, $previous);
    }

    public function getSnapshotPath(): ?string
    {
        return $this->snapshotPath;
    }

    public function getFailingStatement(): ?string
    {
        return $this->failingStatement;
    }
}
