<?php

namespace App\Integrations\Contracts;

use App\Models\IntegrationConnection;
use Carbon\CarbonInterface;

interface IntegrationProvider
{
    public function key(): string;

    public function displayName(): string;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function fetchAssets(IntegrationConnection $connection, ?CarbonInterface $since = null): array;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function discoverClients(IntegrationConnection $connection): array;

    /**
     * @param  array<string, mixed>  $payload
     * @return array<int, array<string, mixed>>
     */
    public function mapWebhookPayload(IntegrationConnection $connection, array $payload): array;
}
