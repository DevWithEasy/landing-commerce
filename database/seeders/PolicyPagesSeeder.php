<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\PageBuilder\Models\PolicyPage;
use Illuminate\Database\Seeder;

class PolicyPagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (PolicyPage::defaultPages() as $pageData) {
            $page = PolicyPage::firstOrCreate(
                ['slug' => $pageData['slug']],
                $pageData
            );

            if (! $page->is_protected) {
                $page->forceFill(['is_protected' => true])->save();
            }
        }
    }
}
