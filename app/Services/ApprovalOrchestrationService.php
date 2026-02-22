<?php

namespace App\Services;

use App\Jobs\EscalateApprovalJob;
use App\Models\Approval;
use App\Notifications\ApprovalReminderNotification;

class ApprovalOrchestrationService
{
    public const DEFAULT_SLA_HOURS = 24;
    public const REMINDER_THRESHOLD_HOURS = 4;

    public function initializeApprovalSla(Approval $approval, ?int $hours = null): void
    {
        $slaHours = $hours ?? self::DEFAULT_SLA_HOURS;
        $dueAt = now()->addHours($slaHours);

        $approval->update([
            'due_at' => $dueAt,
            'notification_status' => 'sent',
        ]);

        // Dispatch a delayed job to escalate precisely when SLA expires
        EscalateApprovalJob::dispatch($approval->id)
            ->delay($dueAt);
    }

    public function sendDueSoonReminders(?int $hours = null): int
    {
        $threshold = $hours ?? self::REMINDER_THRESHOLD_HOURS;

        $dueSoonApprovals = Approval::query()
            ->with(['clientContact', 'changeRequest'])
            ->where('status', Approval::STATUS_PENDING)
            ->whereNotNull('due_at')
            ->whereNull('reminder_sent_at')
            ->where('due_at', '<=', now()->addHours($threshold))
            ->where('due_at', '>', now())
            ->get();

        foreach ($dueSoonApprovals as $approval) {
            $approval->update([
                'reminder_sent_at' => now(),
                'notification_status' => 'reminder_sent',
            ]);

            // Notify the client contact if this is a client approval
            if ($approval->type === Approval::TYPE_CLIENT && $approval->clientContact) {
                $approval->clientContact->notify(new ApprovalReminderNotification($approval));
            }

            $approval->changeRequest?->logEvent(
                'approval_reminder_sent',
                "Reminder sent for {$approval->type} approval #{$approval->id}."
            );
        }

        return $dueSoonApprovals->count();
    }

    public function escalateOverdueApprovals(): int
    {
        $overdueApprovals = Approval::query()
            ->where('status', Approval::STATUS_PENDING)
            ->whereNotNull('due_at')
            ->where('due_at', '<', now())
            ->where(function ($query) {
                $query->whereNull('escalated_at')
                    ->orWhere('escalated_at', '<', now()->subHours(24));
            })
            ->get();

        foreach ($overdueApprovals as $approval) {
            $this->escalateSingleApproval($approval);
        }

        return $overdueApprovals->count();
    }

    /**
     * Escalate a single overdue approval. Used both by the scheduled sweep
     * and by the delayed EscalateApprovalJob for precise SLA escalation.
     */
    public function escalateSingleApproval(Approval $approval): void
    {
        $approval->update([
            'escalated_at' => now(),
            'escalation_level' => (int) $approval->escalation_level + 1,
            'notification_status' => 'escalated',
        ]);

        $approval->changeRequest?->logEvent(
            'approval_escalated',
            "Approval #{$approval->id} escalated at level {$approval->escalation_level}."
        );
    }
}
