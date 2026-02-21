<?php

namespace App\Integrations\Providers;

use App\Integrations\Contracts\IntegrationProvider;
use App\Models\IntegrationConnection;
use Carbon\CarbonInterface;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

abstract class AbstractApiIntegrationProvider implements IntegrationProvider
{
    /**
     * @return array<int, array<string, mixed>>
     */
    abstract public function fetchAssets(IntegrationConnection $connection, ?CarbonInterface $since = null): array;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function discoverClients(IntegrationConnection $connection): array
    {
        $endpoint = (string) Arr::get($connection->settings ?? [], 'clients_endpoint', '/clients');
        $payload = $this->get($connection, $endpoint);
        $items = Arr::get($payload, 'items', Arr::get($payload, 'data', $payload));

        if (!is_array($items)) {
            return [];
        }

        $clients = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $externalClientId = (string) ($item['id'] ?? $item['external_client_id'] ?? '');
            if ($externalClientId === '') {
                continue;
            }

            $clients[] = [
                'external_client_id' => $externalClientId,
                'external_client_name' => (string) ($item['name'] ?? $item['external_client_name'] ?? ''),
                'metadata' => $item,
            ];
        }

        return $clients;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<int, array<string, mixed>>
     */
    public function mapWebhookPayload(IntegrationConnection $connection, array $payload): array
    {
        $items = [];

        if (isset($payload['asset']) && is_array($payload['asset'])) {
            $items = [$payload['asset']];
        } elseif (isset($payload['assets']) && is_array($payload['assets'])) {
            $items = $payload['assets'];
        } elseif (isset($payload['data']) && is_array($payload['data'])) {
            $items = array_is_list($payload['data']) ? $payload['data'] : [$payload['data']];
        } else {
            $items = [$payload];
        }

        $assets = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $attributes = Arr::get($item, 'attributes', []);
            if (!is_array($attributes)) {
                $attributes = [];
            }

            $externalId = (string) (
                $item['id']
                ?? $item['external_id']
                ?? $attributes['id']
                ?? $attributes['external_id']
                ?? ''
            );

            if ($externalId === '') {
                continue;
            }

            $externalType = (string) (
                $item['type']
                ?? $item['external_type']
                ?? $attributes['type']
                ?? $attributes['external_type']
                ?? 'asset'
            );

            $name = (string) (
                $item['name']
                ?? $attributes['name']
                ?? $attributes['deviceName']
                ?? 'External Asset'
            );

            $assets[] = $this->normalizeAsset([
                'external_id' => $externalId,
                'external_type' => $externalType,
                'name' => $name,
                'hostname' => $item['hostname'] ?? $attributes['hostname'] ?? null,
                'ip_address' => $item['ip_address'] ?? $item['ipAddress'] ?? $attributes['ip_address'] ?? null,
                'status' => $item['status'] ?? $attributes['status'] ?? null,
                'external_client_id' => $item['external_client_id'] ?? $attributes['external_client_id'] ?? null,
                'external_client_name' => $item['external_client_name'] ?? $attributes['external_client_name'] ?? null,
                'metadata' => $item,
                'last_seen_at' => now(),
            ]);
        }

        return $assets;
    }

    protected function baseUrl(IntegrationConnection $connection): string
    {
        return rtrim((string) ($connection->base_url ?: ''), '/');
    }

    protected function endpoint(IntegrationConnection $connection, string $default): string
    {
        return (string) Arr::get($connection->settings ?? [], 'assets_endpoint', $default);
    }

    protected function timeout(IntegrationConnection $connection): int
    {
        return (int) Arr::get($connection->settings ?? [], 'timeout_seconds', 30);
    }

    protected function get(IntegrationConnection $connection, string $endpoint, array $query = []): array
    {
        $response = $this->client($connection)
            ->get($this->buildUrl($connection, $endpoint), $query)
            ->throw();

        /** @var array<string, mixed> $json */
        $json = $response->json() ?? [];

        return $json;
    }

    protected function client(IntegrationConnection $connection): PendingRequest
    {
        return Http::acceptJson()
            ->timeout($this->timeout($connection));
    }

    protected function buildUrl(IntegrationConnection $connection, string $endpoint): string
    {
        if (str_starts_with($endpoint, 'http://') || str_starts_with($endpoint, 'https://')) {
            return $endpoint;
        }

        return $this->baseUrl($connection).'/'.ltrim($endpoint, '/');
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function normalizeAsset(array $payload): array
    {
        return [
            'external_id' => (string) ($payload['external_id'] ?? ''),
            'external_type' => (string) ($payload['external_type'] ?? 'asset'),
            'name' => (string) ($payload['name'] ?? 'Unknown Asset'),
            'hostname' => $payload['hostname'] ?? null,
            'ip_address' => $payload['ip_address'] ?? null,
            'status' => $payload['status'] ?? null,
            'external_client_id' => $payload['external_client_id'] ?? null,
            'external_client_name' => $payload['external_client_name'] ?? null,
            'metadata' => $payload['metadata'] ?? [],
            'last_seen_at' => $payload['last_seen_at'] ?? now(),
            'client_id' => $payload['client_id'] ?? null,
        ];
    }
}
