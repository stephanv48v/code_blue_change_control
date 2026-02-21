<?php

namespace App\Jobs;

use App\Models\IntegrationConnection;
use App\Models\User;
use App\Services\IntegrationSyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncIntegrationConnectionJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $connectionId,
        public readonly ?int $triggeredBy = null
    ) {}

    public function handle(IntegrationSyncService $syncService): void
    {
        $connection = IntegrationConnection::find($this->connectionId);

        if (!$connection) {
            return;
        }

        $user = $this->triggeredBy ? User::find($this->triggeredBy) : null;
        $syncService->syncConnection($connection, $user);
    }
}
