<?php

declare(strict_types=1);

namespace App\Modules\Backup\Services;

use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DatabaseDumpService
{
    public function __construct(
        protected ?ConnectionInterface $connection = null
    ) {
        $this->connection = $connection ?? DB::connection();
    }

    /**
     * Get list of base tables for the current database.
     *
     * @return list<string>
     */
    public function getTables(): array
    {
        $driver = $this->connection->getDriverName();

        if ($driver === 'sqlite') {
            $rows = $this->connection->select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'migrations_lock'");

            return array_map(fn ($r) => (string) ($r->name ?? $r->NAME ?? ''), $rows);
        }

        // Default to MySQL
        $rows = $this->connection->select("SELECT TABLE_NAME as table_name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'");

        return array_map(fn ($r) => (string) ($r->table_name ?? $r->TABLE_NAME ?? ''), $rows);
    }

    /**
     * Generate the CREATE TABLE DDL statement for a table.
     */
    public function getTableCreateSql(string $table): string
    {
        $driver = $this->connection->getDriverName();

        if ($driver === 'sqlite') {
            $rows = $this->connection->select("SELECT sql FROM sqlite_master WHERE type='table' AND name = ?", [$table]);
            $sql = $rows[0]->sql ?? '';

            return $sql ? "{$sql};" : '';
        }

        // MySQL
        $escaped = '`'.str_replace('`', '``', $table).'`';
        $rows = $this->connection->select("SHOW CREATE TABLE {$escaped}");
        $key = 'Create Table';
        $rowArray = (array) ($rows[0] ?? []);

        return isset($rowArray[$key]) ? "{$rowArray[$key]};" : '';
    }

    /**
     * Stream database dump directly to a file and return its SHA-256 checksum and metadata.
     *
     * @return array{
     *     sha256: string,
     *     size_bytes: int,
     *     tables_count: int,
     *     rows_count: int
     * }
     */
    public function dumpToFile(string $filePath): array
    {
        $dir = dirname($filePath);
        if (! is_dir($dir) && ! mkdir($dir, 0755, true) && ! is_dir($dir)) {
            throw new RuntimeException("Failed to create directory [{$dir}].");
        }

        $handle = fopen($filePath, 'wb');
        if (! $handle) {
            throw new RuntimeException("Failed to open file for writing [{$filePath}].");
        }

        $driver = $this->connection->getDriverName();
        $pdo = $this->connection->getPdo();

        // Header
        $now = date('Y-m-d H:i:s');
        fwrite($handle, "-- Landing Commerce Pure-PHP Database Backup\n");
        fwrite($handle, "-- Generated At: {$now}\n");
        fwrite($handle, "-- Database Driver: {$driver}\n\n");

        if ($driver === 'sqlite') {
            fwrite($handle, "PRAGMA foreign_keys = OFF;\n\n");
        } else {
            fwrite($handle, "SET FOREIGN_KEY_CHECKS = 0;\n");
            fwrite($handle, "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n\n");
        }

        $tables = $this->getTables();
        $totalRows = 0;

        foreach ($tables as $table) {
            $quoteChar = $driver === 'sqlite' ? '"' : '`';
            $escapedTable = $quoteChar.str_replace($quoteChar, $quoteChar.$quoteChar, $table).$quoteChar;

            // 1. Drop Table
            fwrite($handle, "-- Table structure for {$table}\n");
            fwrite($handle, "DROP TABLE IF EXISTS {$escapedTable};\n");

            // 2. Create Table
            $createSql = $this->getTableCreateSql($table);
            if ($createSql !== '') {
                fwrite($handle, "{$createSql}\n\n");
            }

            // 3. Table Rows Data
            fwrite($handle, "-- Dumping data for table {$table}\n");

            $batchValues = [];
            $columns = null;
            $columnsHeader = null;

            foreach ($this->connection->table($table)->cursor() as $row) {
                $rowArray = (array) $row;
                if ($columns === null) {
                    $columns = array_keys($rowArray);
                    $escapedColumns = array_map(fn ($col) => $quoteChar.str_replace($quoteChar, $quoteChar.$quoteChar, (string) $col).$quoteChar, $columns);
                    $columnsHeader = implode(', ', $escapedColumns);
                }

                $rowValues = [];
                foreach ($columns as $col) {
                    $val = $rowArray[$col] ?? null;
                    if ($val === null) {
                        $rowValues[] = 'NULL';
                    } elseif (is_int($val) || is_float($val)) {
                        $rowValues[] = (string) $val;
                    } elseif (is_bool($val)) {
                        $rowValues[] = $val ? '1' : '0';
                    } else {
                        $rowValues[] = $pdo->quote((string) $val);
                    }
                }

                $batchValues[] = '('.implode(', ', $rowValues).')';
                $totalRows++;

                if (count($batchValues) >= 250) {
                    $insertSql = "INSERT INTO {$escapedTable} ({$columnsHeader}) VALUES\n".implode(",\n", $batchValues).";\n";
                    fwrite($handle, $insertSql);
                    $batchValues = [];
                }
            }

            if (! empty($batchValues) && $columnsHeader !== null) {
                $insertSql = "INSERT INTO {$escapedTable} ({$columnsHeader}) VALUES\n".implode(",\n", $batchValues).";\n";
                fwrite($handle, $insertSql);
            }

            fwrite($handle, "\n");
        }

        // Footer
        if ($driver === 'sqlite') {
            fwrite($handle, "PRAGMA foreign_keys = ON;\n");
        } else {
            fwrite($handle, "SET FOREIGN_KEY_CHECKS = 1;\n");
        }

        fclose($handle);

        $size = filesize($filePath);
        $sha256 = hash_file('sha256', $filePath);

        return [
            'sha256' => (string) $sha256,
            'size_bytes' => $size !== false ? $size : 0,
            'tables_count' => count($tables),
            'rows_count' => $totalRows,
        ];
    }
}
