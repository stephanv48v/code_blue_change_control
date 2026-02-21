<?php

namespace App\Services;

use App\Models\Approval;
use App\Models\ChangeCommunication;
use App\Models\ChangeRunbookStep;
use App\Models\ChangeRequest;
use App\Models\ExternalAsset;
use App\Models\IntegrationConnection;
use App\Models\IntegrationSyncRun;
use App\Models\PostImplementationReview;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * Get dashboard KPIs
     */
    public function getKPIs(): array
    {
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();

        return [
            // Changes this month
            'changes_this_month' => ChangeRequest::whereBetween('created_at', [$startOfMonth, $endOfMonth])->count(),
            
            // Pending approvals (client + CAB)
            'pending_approvals' => ChangeRequest::whereIn('status', ['submitted', 'pending_approval'])->count(),
            
            // Changes scheduled this month
            'scheduled_this_month' => ChangeRequest::whereBetween('scheduled_start_date', [$startOfMonth, $endOfMonth])
                ->whereIn('status', ['scheduled', 'in_progress', 'completed'])
                ->count(),
            
            // Completion rate (completed / total non-cancelled)
            'completion_rate' => $this->calculateCompletionRate($startOfMonth, $endOfMonth),
            
            // Changes by status
            'by_status' => $this->getChangesByStatus(),
            
            // Recent changes
            'recent_changes' => $this->getRecentChanges(5),
            
            // Upcoming changes (next 7 days)
            'upcoming_changes' => $this->getUpcomingChanges(7),

            // Integration health
            'integrations_active' => IntegrationConnection::where('is_active', true)->count(),
            'assets_managed' => ExternalAsset::count(),
            'sync_failures_24h' => IntegrationSyncRun::where('status', IntegrationSyncRun::STATUS_FAILED)
                ->where('created_at', '>=', now()->subDay())
                ->count(),

            // Governance
            'changes_requiring_cab' => ChangeRequest::where('requires_cab_approval', true)
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->count(),

            // Approval orchestration
            'overdue_approvals' => Approval::where('status', Approval::STATUS_PENDING)
                ->whereNotNull('due_at')
                ->where('due_at', '<', now())
                ->count(),
            'approval_reminders_24h' => Approval::whereNotNull('reminder_sent_at')
                ->where('reminder_sent_at', '>=', now()->subDay())
                ->count(),

            // Communications + PIR
            'communications_sent_24h' => ChangeCommunication::where('status', ChangeCommunication::STATUS_SENT)
                ->where('sent_at', '>=', now()->subDay())
                ->count(),
            'pir_completed_this_month' => PostImplementationReview::whereBetween('reviewed_at', [$startOfMonth, $endOfMonth])
                ->count(),
            'runbook_completion_rate' => $this->calculateRunbookCompletionRate(),
        ];
    }

    /**
     * Calculate completion rate
     */
    private function calculateCompletionRate(CarbonInterface $from, CarbonInterface $to): float
    {
        $total = ChangeRequest::whereBetween('created_at', [$from, $to])
            ->where('status', '!=', 'cancelled')
            ->count();
        
        if ($total === 0) {
            return 0.0;
        }

        $completed = ChangeRequest::whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->count();

        return round(($completed / $total) * 100, 1);
    }

    /**
     * Get changes grouped by status
     */
    private function getChangesByStatus(): array
    {
        return ChangeRequest::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
    }

    /**
     * Get recent changes
     */
    private function getRecentChanges(int $limit): Collection
    {
        return ChangeRequest::with(['client', 'requester'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get upcoming scheduled changes
     */
    private function getUpcomingChanges(int $days): Collection
    {
        $from = now();
        $to = now()->addDays($days);

        return ChangeRequest::with(['client', 'requester', 'assignedEngineer'])
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->whereBetween('scheduled_start_date', [$from, $to])
            ->orderBy('scheduled_start_date')
            ->get();
    }

    private function calculateRunbookCompletionRate(): float
    {
        // Only count steps belonging to active (in_progress or completed) changes
        $activeChangeIds = ChangeRequest::whereIn('status', ['in_progress', 'completed'])
            ->pluck('id');

        if ($activeChangeIds->isEmpty()) {
            return 0.0;
        }

        $total = ChangeRunbookStep::whereIn('change_request_id', $activeChangeIds)->count();

        if ($total === 0) {
            return 0.0;
        }

        $completed = ChangeRunbookStep::whereIn('change_request_id', $activeChangeIds)
            ->where('status', ChangeRunbookStep::STATUS_COMPLETED)
            ->count();

        return round(($completed / $total) * 100, 1);
    }

    /**
     * Get changes for CSV export
     */
    public function getExportData(array $filters = []): Collection
    {
        $query = ChangeRequest::with(['client', 'requester', 'assignedEngineer', 'approver']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['client_id'])) {
            $query->where('client_id', $filters['client_id']);
        }

        if (!empty($filters['from_date'])) {
            $query->whereDate('created_at', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->whereDate('created_at', '<=', $filters['to_date']);
        }

        return $query->orderBy('created_at', 'desc')->limit(5000)->get();
    }

    /**
     * Get client-specific dashboard data
     */
    public function getClientDashboard(int $clientId): array
    {
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();

        return [
            'total_changes' => ChangeRequest::where('client_id', $clientId)->count(),
            'changes_this_month' => ChangeRequest::where('client_id', $clientId)
                ->whereBetween('created_at', [$startOfMonth, $now])
                ->count(),
            'pending_approval' => ChangeRequest::where('client_id', $clientId)
                ->whereIn('status', ['submitted', 'pending_approval'])
                ->count(),
            'scheduled' => ChangeRequest::where('client_id', $clientId)
                ->whereIn('status', ['scheduled', 'in_progress'])
                ->count(),
            'recent' => ChangeRequest::where('client_id', $clientId)
                ->with('requester')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
        ];
    }
}
