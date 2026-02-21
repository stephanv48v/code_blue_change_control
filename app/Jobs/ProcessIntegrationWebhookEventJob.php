<?php

namespace App\Jobs;

use App\Models\IntegrationWebhookEvent;
use App\Services\IntegrationSyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class ProcessIntegrationWebhookEventJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $webhookEventId
    ) {}

    public function handle(IntegrationSyncService $syncService): void
    {
        $event = IntegrationWebhookEvent::query()
            ->with('connection')
            ->find($this->webhookEventId);

        if (!$event || !$event->connection) {
            return;
        }

        if (!$event->connection->is_active) {
            $event->update([
                'status' => IntegrationWebhookEvent::STATUS_IGNORED,
                'error_message' => 'Integration is inactive.',
                'processed_at' => now(),
            ]);

            return;
        }

        $event->update([
            'status' => IntegrationWebhookEvent::STATUS_PROCESSING,
        ]);

        try {
            $run = $syncService->processWebhookPayload($event->connection, $event->payload);

            $event->update([
                'status' => IntegrationWebhookEvent::STATUS_PROCESSED,
                'integration_sync_run_id' => $run->id,
                'processed_at' => now(),
            ]);
        } catch (Throwable $exception) {
            $event->update([
                'status' => IntegrationWebhookEvent::STATUS_FAILED,
                'error_message' => $exception->getMessage(),
                'processed_at' => now(),
            ]);
        }
    }
}
