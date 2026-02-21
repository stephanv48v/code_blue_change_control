<?php

namespace App\Services;

use App\Models\ExternalAsset;
use App\Models\IntegrationClientMapping;
use App\Models\IntegrationConnection;
use App\Models\IntegrationSyncRun;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Throwable;

class IntegrationSyncService
{
    public function __construct(
        private readonly IntegrationProviderRegistry $providerRegistry
    ) {}

    public function syncConnection(IntegrationConnection $connection, ?User $triggeredBy = null): IntegrationSyncRun
    {
        if (!$connection->is_active) {
            throw new \RuntimeException('Cannot sync an inactive integration connection.');
        }

        try {
            $provider = $this->providerRegistry->resolve($connection->provider);
            $assets = $provider->fetchAssets($connection, $connection->last_synced_at);
            return $this->ingestAssets(
                $connection,
                $assets,
                $triggeredBy,
                'pull',
                [
                    'provider' => $connection->provider,
                    'connection' => $connection->name,
                    'source' => 'pull_sync',
                ]
            );
        } catch (Throwable $e) {
            $run = IntegrationSyncRun::create([
                'integration_connection_id' => $connection->id,
                'triggered_by' => $triggeredBy?->id,
                'status' => IntegrationSyncRun::STATUS_FAILED,
                'started_at' => now(),
                'completed_at' => now(),
                'direction' => 'pull',
                'summary' => [
                    'provider' => $connection->provider,
                    'connection' => $connection->name,
                    'source' => 'pull_sync',
                ],
                'error_message' => $e->getMessage(),
            ]);

            return $run->fresh();
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function processWebhookPayload(
        IntegrationConnection $connection,
        array $payload,
        ?User $triggeredBy = null
    ): IntegrationSyncRun {
        if (!$connection->is_active) {
            throw new \RuntimeException('Cannot process webhook for an inactive integration connection.');
        }

        try {
            $provider = $this->providerRegistry->resolve($connection->provider);
            $assets = $provider->mapWebhookPayload($connection, $payload);

            return $this->ingestAssets(
                $connection,
                $assets,
                $triggeredBy,
                'push',
                [
                    'provider' => $connection->provider,
                    'connection' => $connection->name,
                    'source' => 'webhook',
                ]
            );
        } catch (Throwable $e) {
            $run = IntegrationSyncRun::create([
                'integration_connection_id' => $connection->id,
                'triggered_by' => $triggeredBy?->id,
                'status' => IntegrationSyncRun::STATUS_FAILED,
                'started_at' => now(),
                'completed_at' => now(),
                'direction' => 'push',
                'summary' => [
                    'provider' => $connection->provider,
                    'connection' => $connection->name,
                    'source' => 'webhook',
                ],
                'error_message' => $e->getMessage(),
            ]);

            return $run->fresh();
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function discoverExternalClients(IntegrationConnection $connection): array
    {
        $provider = $this->providerRegistry->resolve($connection->provider);
        $clients = $provider->discoverClients($connection);

        $normalized = [];
        foreach ($clients as $client) {
            if (!is_array($client)) {
                continue;
            }

            $externalClientId = (string) ($client['external_client_id'] ?? '');
            if ($externalClientId === '') {
                continue;
            }

            $normalized[] = [
                'external_client_id' => $externalClientId,
                'external_client_name' => (string) ($client['external_client_name'] ?? ''),
                'metadata' => $client['metadata'] ?? null,
            ];
        }

        return $normalized;
    }

    /**
     * @param  array<int, array<string, mixed>>  $assets
     * @param  array<string, mixed>  $summary
     */
    private function ingestAssets(
        IntegrationConnection $connection,
        array $assets,
        ?User $triggeredBy,
        string $direction,
        array $summary
    ): IntegrationSyncRun {
        $run = IntegrationSyncRun::create([
            'integration_connection_id' => $connection->id,
            'triggered_by' => $triggeredBy?->id,
            'status' => IntegrationSyncRun::STATUS_RUNNING,
            'started_at' => now(),
            'direction' => $direction,
            'summary' => $summary,
        ]);

        return DB::transaction(function () use ($connection, $assets, $run) {
            $clientMap = $this->clientMapForConnection($connection);

            $created = 0;
            $updated = 0;
            $failed = 0;

            foreach ($assets as $assetPayload) {
                try {
                    $externalId = (string) ($assetPayload['external_id'] ?? '');
                    $externalType = (string) ($assetPayload['external_type'] ?? '');

                    if ($externalId === '' || $externalType === '') {
                        $failed++;
                        continue;
                    }

                    $attributes = [
                        'client_id' => $this->resolveClientId($assetPayload, $connection, $clientMap),
                        'provider' => $connection->provider,
                        'name' => (string) ($assetPayload['name'] ?? 'Unknown Asset'),
                        'hostname' => $assetPayload['hostname'] ?? null,
                        'ip_address' => $assetPayload['ip_address'] ?? null,
                        'status' => $assetPayload['status'] ?? null,
                        'metadata' => $assetPayload['metadata'] ?? [],
                        'last_seen_at' => $assetPayload['last_seen_at'] ?? now(),
                    ];

                    $existing = ExternalAsset::where('integration_connection_id', $connection->id)
                        ->where('external_id', $externalId)
                        ->where('external_type', $externalType)
                        ->first();

                    if ($existing) {
                        $existing->update($attributes);
                        $updated++;
                    } else {
                        ExternalAsset::create(array_merge($attributes, [
                            'integration_connection_id' => $connection->id,
                            'external_id' => $externalId,
                            'external_type' => $externalType,
                        ]));
                        $created++;
                    }
                } catch (Throwable) {
                    $failed++;
                }
            }

            $processed = count($assets);
            $status = $failed > 0
                ? IntegrationSyncRun::STATUS_PARTIAL
                : IntegrationSyncRun::STATUS_SUCCESS;

            $run->update([
                'status' => $status,
                'items_processed' => $processed,
                'items_created' => $created,
                'items_updated' => $updated,
                'items_failed' => $failed,
                'completed_at' => now(),
            ]);

            $connection->update([
                'last_synced_at' => now(),
            ]);

            return $run->fresh();
        });
    }

    /**
     * @return Collection<int, IntegrationConnection>
     */
    public function dueConnections(): Collection
    {
        return IntegrationConnection::query()
            ->where('is_active', true)
            ->get()
            ->filter(function (IntegrationConnection $connection): bool {
                if ($connection->last_synced_at === null) {
                    return true;
                }

                return $connection->last_synced_at->addMinutes($connection->sync_frequency_minutes)->lte(now());
            })
            ->values();
    }

    public function retryFailedRuns(int $maxRetries = 3): int
    {
        $failedRuns = IntegrationSyncRun::query()
            ->with(['connection', 'triggeredBy'])
            ->where('status', IntegrationSyncRun::STATUS_FAILED)
            ->where('retry_count', '<', $maxRetries)
            ->where(function ($query) {
                $query->whereNull('next_retry_at')
                    ->orWhere('next_retry_at', '<=', now());
            })
            ->orderBy('created_at')
            ->limit(25)
            ->get();

        $retried = 0;

        foreach ($failedRuns as $run) {
            if (!$run->connection || !$run->connection->is_active) {
                continue;
            }

            $run->update([
                'retry_count' => $run->retry_count + 1,
                'next_retry_at' => now()->addMinutes(15),
            ]);

            $this->syncConnection($run->connection, $run->triggeredBy);
            $retried++;
        }

        return $retried;
    }

    /**
     * @return array<string, int>
     */
    private function clientMapForConnection(IntegrationConnection $connection): array
    {
        return IntegrationClientMapping::query()
            ->where('integration_connection_id', $connection->id)
            ->where('is_active', true)
            ->pluck('client_id', 'external_client_id')
            ->mapWithKeys(
                fn ($clientId, $externalClientId) => [(string) $externalClientId => (int) $clientId]
            )
            ->all();
    }

    /**
     * @param  array<string, mixed>  $assetPayload
     * @param  array<string, int>  $clientMap
     */
    private function resolveClientId(
        array $assetPayload,
        IntegrationConnection $connection,
        array $clientMap
    ): ?int {
        $directClientId = $assetPayload['client_id'] ?? null;
        if (is_numeric($directClientId)) {
            return (int) $directClientId;
        }

        $externalClientId = $assetPayload['external_client_id'] ?? null;
        if ($externalClientId !== null) {
            $mappedClientId = $clientMap[(string) $externalClientId] ?? null;
            if ($mappedClientId) {
                return $mappedClientId;
            }
        }

        return $connection->client_id;
    }
}
