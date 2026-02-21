<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\IntegrationConnection;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class IntegrationDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_discovery_pulls_external_clients_into_flash_context(): void
    {
        $user = User::factory()->create();
        $user->assignRole('MSP Admin');

        $connection = IntegrationConnection::create([
            'name' => 'Discovery Test',
            'provider' => 'custom',
            'auth_type' => 'api_key',
            'base_url' => 'https://api.test.local',
            'credentials' => ['api_key' => 'secret'],
            'settings' => ['clients_endpoint' => '/clients'],
            'sync_frequency_minutes' => 60,
            'is_active' => true,
        ]);

        Http::fake([
            'https://api.test.local/clients*' => Http::response([
                'items' => [
                    ['id' => 'ext-1', 'name' => 'Acme'],
                    ['id' => 'ext-2', 'name' => 'Globex'],
                ],
            ], 200),
        ]);

        $response = $this->actingAs($user)
            ->post(route('integrations.discover-clients', $connection), [
                'auto_map' => false,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('integration_discovered_clients');

        /** @var array<int, array<string, mixed>> $discovered */
        $discovered = session('integration_discovered_clients');
        $this->assertCount(2, $discovered);
        $this->assertSame('ext-1', $discovered[0]['external_client_id']);
    }

    public function test_discovery_can_auto_map_by_exact_client_name(): void
    {
        $user = User::factory()->create();
        $user->assignRole('MSP Admin');

        $localClient = Client::factory()->create([
            'name' => 'Acme Corp',
        ]);

        $connection = IntegrationConnection::create([
            'name' => 'AutoMap Test',
            'provider' => 'custom',
            'auth_type' => 'api_key',
            'base_url' => 'https://api.test.local',
            'credentials' => ['api_key' => 'secret'],
            'settings' => ['clients_endpoint' => '/clients'],
            'sync_frequency_minutes' => 60,
            'is_active' => true,
        ]);

        Http::fake([
            'https://api.test.local/clients*' => Http::response([
                'items' => [
                    ['id' => 'tenant-100', 'name' => 'Acme Corp'],
                ],
            ], 200),
        ]);

        $this->actingAs($user)
            ->post(route('integrations.discover-clients', $connection), [
                'auto_map' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('integration_client_mappings', [
            'integration_connection_id' => $connection->id,
            'external_client_id' => 'tenant-100',
            'client_id' => $localClient->id,
            'is_active' => true,
        ]);
    }
}
