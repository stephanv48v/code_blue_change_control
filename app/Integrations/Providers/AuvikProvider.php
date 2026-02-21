<?php

namespace App\Integrations\Providers;

use App\Models\IntegrationConnection;
use Carbon\CarbonInterface;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Arr;

class AuvikProvider extends AbstractApiIntegrationProvider
{
    public function key(): string
    {
        return 'auvik';
    }

    public function displayName(): string
    {
        return 'Auvik';
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function fetchAssets(IntegrationConnection $connection, ?CarbonInterface $since = null): array
    {
        $endpoint = $this->endpoint($connection, '/v1/inventory/device');
        $query = ['page[first]' => 1000];

        if ($since) {
            $query['filter[modifiedAt][gte]'] = $since->toIso8601String();
        }

        $payload = $this->get($connection, $endpoint, $query);
        $items = Arr::get($payload, 'data', []);

        if (!is_array($items)) {
            return [];
        }

        $assets = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $id = (string) ($item['id'] ?? '');
            $attributes = Arr::get($item, 'attributes', []);
            if ($id === '' || !is_array($attributes)) {
                continue;
            }

            $assets[] = $this->normalizeAsset([
                'external_id' => $id,
                'external_type' => (string) ($attributes['deviceType'] ?? 'network_device'),
                'name' => (string) ($attributes['deviceName'] ?? 'Auvik Device'),
                'hostname' => $attributes['deviceName'] ?? null,
                'ip_address' => $attributes['primaryIp'] ?? null,
                'status' => (string) ($attributes['monitoringStatus'] ?? 'unknown'),
                'external_client_id' => data_get($item, 'relationships.tenant.data.id'),
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
        $endpoint = $this->endpoint($connection, '/v1/tenants');
        $payload = $this->get($connection, $endpoint, ['page[first]' => 1000]);
        $items = Arr::get($payload, 'data', []);

        if (!is_array($items)) {
            return [];
        }

        $clients = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $attributes = Arr::get($item, 'attributes', []);
            $externalId = (string) ($item['id'] ?? '');
            if ($externalId === '') {
                continue;
            }

            $name = (string) (
                $attributes['tenantName']
                ?? $attributes['name']
                ?? 'Auvik Tenant'
            );

            $clients[] = [
                'external_client_id' => $externalId,
                'external_client_name' => $name,
                'metadata' => $item,
            ];
        }

        return $clients;
    }

    protected function client(IntegrationConnection $connection): PendingRequest
    {
        $credentials = $connection->credentials ?? [];
        $apiToken = (string) ($credentials['api_token'] ?? '');

        return parent::client($connection)->withToken($apiToken);
    }
}
