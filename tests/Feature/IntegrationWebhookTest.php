<?php

namespace Tests\Feature;

use App\Jobs\ProcessIntegrationWebhookEventJob;
use App\Models\Client;
use App\Models\IntegrationClientMapping;
use App\Models\IntegrationConnection;
use App\Models\IntegrationWebhookEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class IntegrationWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_webhook_rejects_invalid_token(): void
    {
        $connection = IntegrationConnection::create([
            'name' => 'Webhook Test',
            'provider' => 'custom',
            'auth_type' => 'api_key',
            'base_url' => 'https://api.test.local',
            'credentials' => ['api_key' => 'secret'],
            'settings' => [],
            'webhook_secret' => 'expected-token',
            'sync_frequency_minutes' => 60,
            'is_active' => true,
        ]);

        $response = $this->postJson(route('integrations.webhook', $connection), [
            'assets' => [
                ['id' => 'a1', 'type' => 'server', 'name' => 'Server A'],
            ],
        ], [
            'X-Webhook-Token' => 'wrong-token',
        ]);

        $response->assertUnauthorized();
        $this->assertDatabaseCount('integration_webhook_events', 0);
    }

    public function test_webhook_accepts_valid_token_and_queues_processing(): void
    {
        Queue::fake();

        $connection = IntegrationConnection::create([
            'name' => 'Webhook Queue Test',
            'provider' => 'custom',
            'auth_type' => 'api_key',
            'base_url' => 'https://api.test.local',
            'credentials' => ['api_key' => 'secret'],
            'settings' => [],
            'webhook_secret' => 'expected-token',
            'sync_frequency_minutes' => 60,
            'is_active' => true,
        ]);

        $response = $this->postJson(route('integrations.webhook', $connection), [
            'event_type' => 'asset.updated',
            'assets' => [
                ['id' => 'a1', 'type' => 'server', 'name' => 'Server A'],
            ],
        ], [
            'X-Webhook-Token' => 'expected-token',
        ]);

        $response->assertStatus(202);
        $this->assertDatabaseHas('integration_webhook_events', [
            'integration_connection_id' => $connection->id,
            'status' => IntegrationWebhookEvent::STATUS_RECEIVED,
            'event_type' => 'asset.updated',
        ]);

        Queue::assertPushed(ProcessIntegrationWebhookEventJob::class);
    }

    public function test_webhook_processing_job_ingests_assets_with_client_mapping(): void
    {
        $defaultClient = Client::factory()->create();
        $mappedClient = Client::factory()->create();

        $connection = IntegrationConnection::create([
            'name' => 'Webhook Process Test',
            'provider' => 'custom',
            'auth_type' => 'api_key',
            'base_url' => 'https://api.test.local',
            'credentials' => ['api_key' => 'secret'],
            'settings' => [],
            'webhook_secret' => 'expected-token',
            'client_id' => $defaultClient->id,
            'sync_frequency_minutes' => 60,
            'is_active' => true,
        ]);

        IntegrationClientMapping::create([
            'integration_connection_id' => $connection->id,
            'client_id' => $mappedClient->id,
            'external_client_id' => 'tenant-42',
            'external_client_name' => 'Mapped Client',
            'is_active' => true,
        ]);

        $event = IntegrationWebhookEvent::create([
            'integration_connection_id' => $connection->id,
            'provider' => 'custom',
            'event_type' => 'asset.created',
            'headers' => [],
            'payload' => [
                'assets' => [
                    [
                        'id' => 'webhook-asset-1',
                        'type' => 'server',
                        'name' => 'Webhook Server',
                        'external_client_id' => 'tenant-42',
                    ],
                ],
            ],
            'status' => IntegrationWebhookEvent::STATUS_RECEIVED,
            'received_at' => now(),
        ]);

        $job = new ProcessIntegrationWebhookEventJob($event->id);
        $job->handle(app(\App\Services\IntegrationSyncService::class));

        $event->refresh();
        $this->assertSame(IntegrationWebhookEvent::STATUS_PROCESSED, $event->status);
        $this->assertNotNull($event->integration_sync_run_id);

        $this->assertDatabaseHas('external_assets', [
            'integration_connection_id' => $connection->id,
            'external_id' => 'webhook-asset-1',
            'external_type' => 'server',
            'name' => 'Webhook Server',
            'client_id' => $mappedClient->id,
        ]);
    }
}
