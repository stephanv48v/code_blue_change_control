<?php

namespace App\Providers;

use App\Models\AppSetting;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->loadDatabaseSettings();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    /**
     * Load settings from the database and merge into runtime config.
     * Gracefully skips if the table does not exist yet (e.g. before migrations).
     */
    protected function loadDatabaseSettings(): void
    {
        try {
            if (! Schema::hasTable('app_settings')) {
                return;
            }

            $map = [
                'microsoft_client_id'     => 'services.microsoft.client_id',
                'microsoft_tenant_id'     => 'services.microsoft.tenant',
            ];

            foreach ($map as $settingKey => $configKey) {
                $value = AppSetting::get($settingKey);
                if (! empty($value)) {
                    config([$configKey => $value]);
                }
            }

            // Client secret is stored encrypted
            $secret = AppSetting::get('microsoft_client_secret');
            if (! empty($secret)) {
                config(['services.microsoft.client_secret' => decrypt($secret)]);
            }
        } catch (\Illuminate\Database\QueryException) {
            // DB unavailable during artisan commands or migrations — skip
        } catch (\Throwable $e) {
            // Decrypt or other failures should be logged so they're actionable
            \Illuminate\Support\Facades\Log::warning('Failed to load app settings: ' . $e->getMessage());
        }
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
