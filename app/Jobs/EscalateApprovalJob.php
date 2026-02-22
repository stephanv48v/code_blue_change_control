<?php

namespace App\Jobs;

use App\Models\Approval;
use App\Services\ApprovalOrchestrationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class EscalateApprovalJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $approvalId
    ) {}

    public function handle(ApprovalOrchestrationService $orchestrationService): void
    {
        $approval = Approval::with(['clientContact', 'changeRequest'])->find($this->approvalId);

        if (!$approval) {
            return;
        }

        // Only escalate if still pending and past due
        if ($approval->status !== Approval::STATUS_PENDING) {
            return;
        }

        if ($approval->due_at === null || $approval->due_at->isFuture()) {
            return;
        }

        $orchestrationService->escalateSingleApproval($approval);
    }
}
