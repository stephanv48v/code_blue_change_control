<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\IntegrationClientMapping;
use App\Models\IntegrationConnection;
use App\Services\IntegrationSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class IntegrationSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_sync_maps_external_client_id_to_local_client(): void
    {
        $defaultClient = Client::factory()->create();
        $mappedClient = Client::factory()->create();

        $connection = IntegrationConnection::create([
            'name' => 'Custom Sync Test',
            'provider' => 'custom',
            'auth_type' => 'api_key',
            'base_url' => 'https://api.test.local',
            'credentials' => ['api_key' => 'secret'],
            'settings' => ['assets_endpoint' => '/assets'],
            'client_id' => $defaultClient->id,
            'sync_frequency_minutes' => 60,
            'is_active' => true,
        ]);

        IntegrationClientMapping::create([
            'integration_connection_id' => $connection->id,
            'client_id' => $mappedClient->id,
            'external_client_id' => 'ext-tenant-1',
            'external_client_name' => 'Mapped Tenant',
            'is_active' => true,
        ]);

        Http::fake([
            'https://api.test.local/assets*' => Http::response([
                'items' => [
                    [
                        'id' => 'asset-100',
                        'type' => 'server',
                        'name' => 'Mapped Asset',
                        'external_client_id' => 'ext-tenant-1',
                    ],
                ],
            ], 200),
        ]);

        /** @var IntegrationSyncService $service */
        $service = app(IntegrationSyncService::class);
        $run = $service->syncConnection($connection);

        $this->assertSame('success', $run->status);
        $this->assertSame(1, $run->items_processed);
        $this->assertSame(1, $run->items_created);

        $this->assertDatabaseHas('external_assets', [
            'integration_connection_id' => $connection->id,
            'external_id' => 'asset-100',
            'external_type' => 'server',
            'name' => 'Mapped Asset',
            'client_id' => $mappedClient->id,
        ]);
    }

    public function test_sync_uses_connection_client_when_no_mapping_exists(): void
    {
        $defaultClient = Client::factory()->create();

        $connection = IntegrationConnection::create([
            'name' => 'Fallback Sync Test',
            'provider' => 'custom',
            'auth_type' => 'api_key',
            'base_url' => 'https://api.test.local',
            'credentials' => ['api_key' => 'secret'],
            'settings' => ['assets_endpoint' => '/assets'],
            'client_id' => $defaultClient->id,
            'sync_frequency_minutes' => 60,
            'is_active' => true,
        ]);

        Http::fake([
            'https://api.test.local/assets*' => Http::response([
                'items' => [
                    [
                        'id' => 'asset-200',
                        'type' => 'switch',
                        'name' => 'Fallback Asset',
                        'external_client_id' => 'unknown-tenant',
                    ],
                ],
            ], 200),
        ]);

        /** @var IntegrationSyncService $service */
        $service = app(IntegrationSyncService::class);
        $run = $service->syncConnection($connection);

        $this->assertSame('success', $run->status);

        $this->assertDatabaseHas('external_assets', [
            'integration_connection_id' => $connection->id,
            'external_id' => 'asset-200',
            'external_type' => 'switch',
            'name' => 'Fallback Asset',
            'client_id' => $defaultClient->id,
        ]);
    }
}
