<?php

namespace App\Integrations\Providers;

use App\Models\IntegrationConnection;
use Carbon\CarbonInterface;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Arr;

class CustomProvider extends AbstractApiIntegrationProvider
{
    public function key(): string
    {
        return 'custom';
    }

    public function displayName(): string
    {
        return 'Custom API';
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function fetchAssets(IntegrationConnection $connection, ?CarbonInterface $since = null): array
    {
        $endpoint = $this->endpoint($connection, '/assets');
        $query = [];

        if ($since) {
            $query['updated_since'] = $since->toIso8601String();
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

            $normalized = $this->normalizeAsset([
                'external_id' => (string) ($item['external_id'] ?? $item['id'] ?? ''),
                'external_type' => (string) ($item['external_type'] ?? $item['type'] ?? 'asset'),
                'name' => (string) ($item['name'] ?? 'External Asset'),
                'hostname' => $item['hostname'] ?? null,
                'ip_address' => $item['ip_address'] ?? null,
                'status' => $item['status'] ?? null,
                'external_client_id' => $item['external_client_id'] ?? $item['organization_id'] ?? null,
                'external_client_name' => $item['external_client_name'] ?? $item['organization_name'] ?? null,
                'metadata' => $item,
                'last_seen_at' => $item['last_seen_at'] ?? now(),
                'client_id' => $item['client_id'] ?? null,
            ]);

            if ($normalized['external_id'] === '') {
                continue;
            }

            $assets[] = $normalized;
        }

        return $assets;
    }

    protected function client(IntegrationConnection $connection): PendingRequest
    {
        $request = parent::client($connection);
        $credentials = $connection->credentials ?? [];
        $authType = (string) $connection->auth_type;

        return match ($authType) {
            'bearer' => $request->withToken((string) ($credentials['token'] ?? $credentials['access_token'] ?? '')),
            'basic' => $request->withBasicAuth(
                (string) ($credentials['username'] ?? ''),
                (string) ($credentials['password'] ?? '')
            ),
            default => $request->withHeaders(
                is_array($credentials['headers'] ?? null)
                    ? $credentials['headers']
                    : ['x-api-key' => (string) ($credentials['api_key'] ?? '')]
            ),
        };
    }
}
