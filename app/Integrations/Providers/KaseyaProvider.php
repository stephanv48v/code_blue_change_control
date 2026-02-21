<?php

namespace App\Integrations\Providers;

use App\Models\IntegrationConnection;
use Carbon\CarbonInterface;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Arr;

class KaseyaProvider extends AbstractApiIntegrationProvider
{
    public function key(): string
    {
        return 'kaseya';
    }

    public function displayName(): string
    {
        return 'Kaseya';
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function fetchAssets(IntegrationConnection $connection, ?CarbonInterface $since = null): array
    {
        $endpoint = $this->endpoint($connection, '/api/v1/assets');
        $query = ['pageSize' => 1000];

        if ($since) {
            $query['updatedSince'] = $since->toIso8601String();
        }

        $payload = $this->get($connection, $endpoint, $query);
        $items = Arr::get($payload, 'items', Arr::get($payload, 'data', $payload));

        if (!is_array($items)) {
            return [];
        }

        $assets = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $id = (string) ($item['id'] ?? $item['assetId'] ?? '');
            if ($id === '') {
                continue;
            }

            $assets[] = $this->normalizeAsset([
                'external_id' => $id,
                'external_type' => (string) ($item['assetType'] ?? 'asset'),
                'name' => (string) ($item['name'] ?? $item['deviceName'] ?? 'Kaseya Asset'),
                'hostname' => $item['hostname'] ?? $item['deviceName'] ?? null,
                'ip_address' => $item['ipAddress'] ?? null,
                'status' => (string) ($item['status'] ?? 'unknown'),
                'external_client_id' => $item['organizationId'] ?? $item['siteId'] ?? null,
                'external_client_name' => $item['organizationName'] ?? $item['siteName'] ?? null,
                'metadata' => $item,
                'last_seen_at' => now(),
            ]);
        }

        return $assets;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function discoverClients(IntegrationConnection $connection): array
    {
        $endpoint = $this->endpoint($connection, '/api/v1/organizations');
        $payload = $this->get($connection, $endpoint, ['pageSize' => 1000]);
        $items = Arr::get($payload, 'items', Arr::get($payload, 'data', $payload));

        if (!is_array($items)) {
            return [];
        }

        $clients = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $externalId = (string) ($item['id'] ?? $item['organizationId'] ?? '');
            if ($externalId === '') {
                continue;
            }

            $clients[] = [
                'external_client_id' => $externalId,
                'external_client_name' => (string) ($item['name'] ?? $item['organizationName'] ?? 'Kaseya Organization'),
                'metadata' => $item,
            ];
        }

        return $clients;
    }

    protected function client(IntegrationConnection $connection): PendingRequest
    {
        $credentials = $connection->credentials ?? [];
        $token = (string) ($credentials['access_token'] ?? $credentials['api_token'] ?? '');

        return parent::client($connection)
            ->withToken($token);
    }
}
