<?php

use App\Models\IntegrationConnection;
use App\Services\ApprovalOrchestrationService;
use App\Services\IntegrationSyncService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('integrations:sync {connectionId?}', function (?int $connectionId = null) {
    /** @var IntegrationSyncService $syncService */
    $syncService = app(IntegrationSyncService::class);

    if ($connectionId !== null) {
        $connection = IntegrationConnection::find($connectionId);

        if (!$connection) {
            $this->error("Integration connection {$connectionId} not found.");
            return 1;
        }

        $run = $syncService->syncConnection($connection);
        $this->info("{$connection->name}: {$run->status} ({$run->items_processed} processed)");

        return 0;
    }

    $connections = $syncService->dueConnections();

    if ($connections->isEmpty()) {
        $this->info('No integration connections are due for sync.');
        return 0;
    }

    foreach ($connections as $connection) {
        $run = $syncService->syncConnection($connection);
        $this->info("{$connection->name}: {$run->status} ({$run->items_processed} processed)");
    }

    return 0;
})->purpose('Sync integration connections and import external assets');

Artisan::command('integrations:retry-failed', function () {
    /** @var IntegrationSyncService $syncService */
    $syncService = app(IntegrationSyncService::class);

    $retried = $syncService->retryFailedRuns();
    $this->info("Retried {$retried} failed integration run(s).");

    return 0;
})->purpose('Retry failed integration sync runs that are due for retry');

Artisan::command('approvals:orchestrate', function () {
    /** @var ApprovalOrchestrationService $orchestrationService */
    $orchestrationService = app(ApprovalOrchestrationService::class);

    $reminders = $orchestrationService->sendDueSoonReminders();
    $escalations = $orchestrationService->escalateOverdueApprovals();

    $this->info("Approval orchestration complete: {$reminders} reminder(s), {$escalations} escalation(s).");

    return 0;
})->purpose('Send approval reminders and escalate overdue approvals');

Schedule::command('integrations:sync')->everyFifteenMinutes();
Schedule::command('integrations:retry-failed')->everyFifteenMinutes();
Schedule::command('approvals:orchestrate')->everyMinute();
