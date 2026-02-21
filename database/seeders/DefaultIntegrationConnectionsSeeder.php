<?php

namespace Database\Seeders;

use App\Models\IntegrationConnection;
use App\Models\User;
use Illuminate\Database\Seeder;

class DefaultIntegrationConnectionsSeeder extends Seeder
{
    /**
     * Seed disabled provider templates for quick onboarding.
     */
    public function run(): void
    {
        $creator = User::query()->orderBy('id')->first();

        if (!$creator) {
            $this->command?->warn('No users found. Skipping default integration template seeding.');
            return;
        }

        $templates = [
            [
                'name' => 'ConnectWise Template',
                'provider' => 'connectwise',
                'auth_type' => 'api_key',
                'base_url' => config('services.connectwise.base_url'),
                'credentials' => [
                    'company_id' => '',
                    'client_id' => '',
                    'public_key' => '',
                    'private_key' => '',
                ],
                'settings' => [
                    'assets_endpoint' => '/v4_6_release/apis/3.0/company/configurations',
                ],
            ],
            [
                'name' => 'IT Glue Template',
                'provider' => 'it_glue',
                'auth_type' => 'api_key',
                'base_url' => config('services.it_glue.base_url'),
                'credentials' => [
                    'api_key' => '',
                ],
                'settings' => [
                    'assets_endpoint' => '/configurations',
                ],
            ],
            [
                'name' => 'Kaseya Template',
                'provider' => 'kaseya',
                'auth_type' => 'bearer',
                'base_url' => config('services.kaseya.base_url'),
                'credentials' => [
                    'access_token' => '',
                ],
                'settings' => [
                    'assets_endpoint' => '/api/v1/assets',
                ],
            ],
            [
                'name' => 'Auvik Template',
                'provider' => 'auvik',
                'auth_type' => 'bearer',
                'base_url' => config('services.auvik.base_url'),
                'credentials' => [
                    'api_token' => '',
                ],
                'settings' => [
                    'assets_endpoint' => '/v1/inventory/device',
                ],
            ],
        ];

        foreach ($templates as $template) {
            $connection = IntegrationConnection::query()
                ->withTrashed()
                ->where('name', $template['name'])
                ->first();

            $attributes = array_merge($template, [
                'created_by' => $creator->id,
                'client_id' => null,
                'sync_frequency_minutes' => 60,
                'is_active' => false,
            ]);

            if ($connection) {
                if ($connection->trashed()) {
                    $connection->restore();
                }
                $connection->fill($attributes)->save();
            } else {
                IntegrationConnection::query()->create($attributes);
            }
        }

        $this->command?->info('Default integration templates seeded.');
    }
}
