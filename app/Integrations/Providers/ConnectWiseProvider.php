<?php

namespace App\Integrations\Providers;

use App\Models\IntegrationConnection;
use Carbon\CarbonInterface;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Arr;

class ConnectWiseProvider extends AbstractApiIntegrationProvider
{
    public function key(): string
    {
        return 'connectwise';
    }

    public function displayName(): string
    {
        return 'ConnectWise';
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function fetchAssets(IntegrationConnection $connection, ?CarbonInterface $since = null): array
    {
        $endpoint = $this->endpoint($connection, '/v4_6_release/apis/3.0/company/configurations');
        $query = ['pageSize' => 1000];

        if ($since) {
            $query['conditions'] = sprintf('lastUpdated > [%s]', $since->format('Y-m-d\TH:i:s\Z'));
        }

        $payload = $this->get($connection, $endpoint, $query);
        $items = Arr::get($payload, 'items', $payload);

        if (!is_array($items)) {
            return [];
        }

        $assets = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $id = $item['id'] ?? null;
            if (!$id) {
                continue;
            }

            $assets[] = $this->normalizeAsset([
                'external_id' => (string) $id,
                'external_type' => (string) (data_get($item, 'type.name') ?? 'configuration'),
                'name' => (string) ($item['name'] ?? $item['deviceName'] ?? 'ConnectWise Asset'),
                'hostname' => $item['name'] ?? null,
                'ip_address' => $item['ipAddress'] ?? null,
                'status' => (string) (data_get($item, 'status.name') ?? 'unknown'),
                'external_client_id' => data_get($item, 'company.id'),
                'external_client_name' => data_get($item, 'company.name'),
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
        $endpoint = $this->endpoint($connection, '/v4_6_release/apis/3.0/company/companies');
        $payload = $this->get($connection, $endpoint, ['pageSize' => 1000]);
        $items = data_get($payload, 'items', $payload);

        if (!is_array($items)) {
            return [];
        }

        $clients = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $externalId = (string) ($item['id'] ?? '');
            if ($externalId === '') {
                continue;
            }

            $clients[] = [
                'external_client_id' => $externalId,
                'external_client_name' => (string) ($item['name'] ?? 'ConnectWise Company'),
                'metadata' => $item,
            ];
        }

        return $clients;
    }

    /**
     * Fetch a single service ticket by its numeric ID.
     *
     * @return array<string, mixed>
     */
    public function fetchTicket(IntegrationConnection $connection, int $ticketNumber): array
    {
        $endpoint = "/v4_6_release/apis/3.0/service/tickets/{$ticketNumber}";
        return $this->get($connection, $endpoint);
    }

    protected function client(IntegrationConnection $connection): PendingRequest
    {
        $credentials = $connection->credentials ?? [];
        $company = (string) ($credentials['company_id'] ?? $credentials['company'] ?? '');
        $publicKey = (string) ($credentials['public_key'] ?? '');
        $privateKey = (string) ($credentials['private_key'] ?? '');
        $clientId = (string) ($credentials['client_id'] ?? '');

        $token = base64_encode($company.'+'.$publicKey.':'.$privateKey);

        return parent::client($connection)
            ->withHeaders([
                'Authorization' => 'Basic '.$token,
                'clientId' => $clientId,
            ]);
    }
}
