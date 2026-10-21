<?php

declare(strict_types=1);

use App\Modules\PageBuilder\Models\PolicyPage;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('policy_pages', 'is_protected')) {
            Schema::table('policy_pages', function (Blueprint $table) {
                $table->boolean('is_protected')->default(false);
            });
        }

        foreach (PolicyPage::defaultPages() as $pageData) {
            $existing = PolicyPage::query()
                ->where('slug', $pageData['slug'])
                ->first();

            if ($existing) {
                if (! $existing->is_protected) {
                    $existing->forceFill(['is_protected' => true])->save();
                }

                continue;
            }

            PolicyPage::create($pageData);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('policy_pages', 'is_protected')) {
            Schema::table('policy_pages', function (Blueprint $table) {
                $table->dropColumn('is_protected');
            });
        }
    }
};
