<?php

namespace App\Providers;

use App\Models\User;
use App\Modules\Backup\Commands\CommerceBackupCommand;
use App\Modules\Backup\Commands\CommerceRestoreCommand;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Policies\ProductPolicy;
use App\Modules\Couriers\Services\CourierManager;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Policies\OrderPolicy;
use App\Modules\Settings\Models\Setting;
use App\Modules\Settings\Policies\SettingPolicy;
use App\Modules\Settings\Services\SettingsService;
use App\Modules\Setup\Commands\CommerceInstallCommand;
use App\Modules\Setup\Commands\CommercePreflightCommand;
use App\Modules\Sms\Services\SmsManager;
use App\Modules\Sms\Services\SmsTemplateService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(CourierManager::class);
        $this->app->singleton(SmsTemplateService::class);
        $this->app->singleton(SmsManager::class);
        $this->app->singleton(SettingsService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Setting::class, SettingPolicy::class);

        Gate::define('manage-settings', fn (User $user) => $user->canManageSettings());
        Gate::define('manage-backups', fn (User $user) => $user->canManageBackups());
        Gate::define('manage-catalog', fn (User $user) => $user->canManageCatalog());
        Gate::define('manage-media', fn (User $user) => $user->canManageMedia());
        Gate::define('manage-orders', fn (User $user) => $user->canManageOrders());
        Gate::define('manage-landing-pages', fn (User $user) => $user->canManageLandingPages());
        Gate::define('manage-categories', fn (User $user) => $user->canManageCategories());
        Gate::define('manage-policy-pages', fn (User $user) => $user->canManagePolicyPages());
        Gate::define('manage-appearance', fn (User $user) => $user->canManageAppearance());
        Gate::define('manage-shipping-methods', fn (User $user) => $user->canManageShippingAndPayments());
        Gate::define('manage-payment-methods', fn (User $user) => $user->canManageShippingAndPayments());

        $this->ensureViteHotFileIsValid();
        $this->ensureComboPackColumnsExist();

        // Apply decrypted database settings to runtime configuration
        $this->app->make(SettingsService::class)->applyRuntimeOverrides();

        if ($this->app->runningInConsole()) {
            $this->commands([
                CommerceBackupCommand::class,
                CommerceRestoreCommand::class,
                CommercePreflightCommand::class,
                CommerceInstallCommand::class,
            ]);
        }
    }

    /**
     * Prevent stale public/hot files from causing blank pages when Vite is closed.
     */
    protected function ensureViteHotFileIsValid(): void
    {
        $hotFile = public_path('hot');
        if (is_file($hotFile)) {
            $url = trim((string) @file_get_contents($hotFile));
            $parts = parse_url($url);
            $host = $parts['host'] ?? '127.0.0.1';
            $port = (int) ($parts['port'] ?? 5173);

            $connection = @fsockopen($host, $port, $errno, $errstr, 0.05);
            if ($connection) {
                fclose($connection);
            } else {
                @unlink($hotFile);
            }
        }
    }

    /**
     * Automatically ensure combo_pack_size, combo_colors, combo_sizes and combo_summary columns exist on existing databases.
     */
    protected function ensureComboPackColumnsExist(): void
    {
        $flagFile = storage_path('framework/cache/combo_pack_schema_v2.flag');
        if (! $this->app->runningUnitTests() && is_file($flagFile)) {
            return;
        }

        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('products')) {
                if (! \Illuminate\Support\Facades\Schema::hasColumn('products', 'combo_pack_size')) {
                    \Illuminate\Support\Facades\Schema::table('products', function (\Illuminate\Database\Schema\Blueprint $table) {
                        $table->unsignedTinyInteger('combo_pack_size')->default(1)->after('has_variants');
                    });
                }

                if (! \Illuminate\Support\Facades\Schema::hasColumn('products', 'combo_colors')) {
                    \Illuminate\Support\Facades\Schema::table('products', function (\Illuminate\Database\Schema\Blueprint $table) {
                        $table->json('combo_colors')->nullable()->after('combo_pack_size');
                    });
                }

                if (! \Illuminate\Support\Facades\Schema::hasColumn('products', 'combo_sizes')) {
                    \Illuminate\Support\Facades\Schema::table('products', function (\Illuminate\Database\Schema\Blueprint $table) {
                        $table->json('combo_sizes')->nullable()->after('combo_colors');
                    });
                }
            }

            if (
                \Illuminate\Support\Facades\Schema::hasTable('cart_items') &&
                ! \Illuminate\Support\Facades\Schema::hasColumn('cart_items', 'combo_summary')
            ) {
                \Illuminate\Support\Facades\Schema::table('cart_items', function (\Illuminate\Database\Schema\Blueprint $table) {
                    $table->string('combo_summary', 500)->nullable()->after('variant_id');
                });
            }

            if (
                ! $this->app->runningUnitTests() &&
                \Illuminate\Support\Facades\Schema::hasTable('products') &&
                \Illuminate\Support\Facades\Schema::hasColumn('products', 'combo_colors') &&
                \Illuminate\Support\Facades\Schema::hasColumn('products', 'combo_sizes')
            ) {
                @file_put_contents($flagFile, '1');
            }
        } catch (\Throwable) {
            // Ignore when DB is not ready or during CLI preflight
        }
    }
}
