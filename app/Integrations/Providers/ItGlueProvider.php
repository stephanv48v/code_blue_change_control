<?php

namespace App\Integrations\Providers;

use App\Models\IntegrationConnection;
use Carbon\CarbonInterface;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Arr;

class ItGlueProvider extends AbstractApiIntegrationProvider
{
    public function key(): string
    {
        return 'it_glue';
    }

    public function displayName(): string
    {
        return 'IT Glue';
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function fetchAssets(IntegrationConnection $connection, ?CarbonInterface $since = null): array
    {
        $endpoint = $this->endpoint($connection, '/configurations');
        $query = ['page[size]' => 1000];

        if ($since) {
            $query['filter[updated_at]'] = $since->toIso8601String();
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

            $attributes = Arr::get($item, 'attributes', []);
            $id = (string) ($item['id'] ?? '');
            if ($id === '') {
                continue;
            }

            $assets[] = $this->normalizeAsset([
                'external_id' => $id,
                'external_type' => 'configuration',
                'name' => (string) ($attributes['name'] ?? 'IT Glue Configuration'),
                'hostname' => $attributes['hostname'] ?? null,
                'ip_address' => $attributes['primary-ip'] ?? null,
                'status' => (string) ($attributes['configuration-status-name'] ?? 'unknown'),
                'external_client_id' => $attributes['organization-id'] ?? null,
                'external_client_name' => $attributes['organization-name'] ?? null,
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
        $endpoint = $this->endpoint($connection, '/organizations');
        $payload = $this->get($connection, $endpoint, ['page[size]' => 1000]);
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

            $clients[] = [
                'external_client_id' => $externalId,
                'external_client_name' => (string) ($attributes['name'] ?? 'IT Glue Organization'),
                'metadata' => $item,
            ];
        }

        return $clients;
    }

    protected function client(IntegrationConnection $connection): PendingRequest
    {
        $credentials = $connection->credentials ?? [];
        $apiKey = (string) ($credentials['api_key'] ?? '');

        return parent::client($connection)
            ->withHeaders([
                'x-api-key' => $apiKey,
            ]);
    }
}
