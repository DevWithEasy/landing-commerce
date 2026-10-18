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
        Gate::define('manage-orders', fn (User $user) => $user->canManageOrders());
        Gate::define('manage-landing-pages', fn (User $user) => $user->canManageLandingPages());

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
}
