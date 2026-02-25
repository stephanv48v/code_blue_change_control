<?php

namespace App\Http\Controllers;

use App\Models\ChangeRequest;
use App\Services\DashboardService;
use App\Services\WorkflowService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService
    ) {}

    /**
     * Export changes to CSV.
     *
     * Supports a `filter` query parameter for report-specific exports:
     *   - risk           → sorted by risk level, includes risk columns
     *   - approvals      → only approved / rejected changes with approval details
     *   - emergency       → only emergency change type
     *   - client         → sorted by client name
     *   - stalled        → changes stuck in a status for > 7 days
     *   - security_patch → only security_patch change type
     */
    public function changes(Request $request): StreamedResponse
    {
        $this->authorize('changes.view');

        $filter = $request->input('filter');
        $filters = $request->only(['status', 'client_id', 'from_date', 'to_date']);

        $query = ChangeRequest::with(['client', 'requester', 'assignedEngineer', 'approver']);

        // Apply basic filters
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

        // Apply report-specific filters
        $filename = 'changes';
        switch ($filter) {
            case 'risk':
                $filename = 'risk_profile';
                $query->orderByRaw("FIELD(risk_level, 'high', 'medium', 'low')");
                break;

            case 'approvals':
                $filename = 'approvals_report';
                $query->whereIn('status', [
                    ChangeRequest::STATUS_APPROVED,
                    ChangeRequest::STATUS_REJECTED,
                ]);
                break;

            case 'emergency':
                $filename = 'emergency_changes';
                $query->where('change_type', 'emergency');
                break;

            case 'client':
                $filename = 'client_activity';
                $query->join('clients', 'change_requests.client_id', '=', 'clients.id')
                    ->orderBy('clients.name')
                    ->select('change_requests.*');
                break;

            case 'stalled':
                $filename = 'stalled_changes';
                $query->whereNotIn('status', [
                    ChangeRequest::STATUS_COMPLETED,
                    ChangeRequest::STATUS_CANCELLED,
                ])
                    ->where('updated_at', '<', now()->subDays(7));
                break;

            case 'security_patch':
                $filename = 'security_patch';
                $query->where('change_type', 'security_patch');
                break;

            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $changes = $query->limit(5000)->get();

        $csvHeaders = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '_' . now()->format('Y-m-d') . '.csv"',
        ];

        return response()->stream(function () use ($changes, $filter) {
            $file = fopen('php://output', 'w');

            fputcsv($file, [
                'Change ID',
                'Title',
                'Client',
                'Status',
                'Priority',
                'Risk Level',
                'Change Type',
                'Requester',
                'Assigned Engineer',
                'Created At',
                'Scheduled Start',
                'Scheduled End',
                'Approved At',
                'Last Updated',
            ]);

            foreach ($changes as $change) {
                fputcsv($file, [
                    $this->csvSafe($change->change_id),
                    $this->csvSafe($change->title),
                    $this->csvSafe($change->client?->name ?? 'N/A'),
                    $change->status,
                    $change->priority,
                    $change->risk_level ?? '',
                    $change->change_type ?? '',
                    $this->csvSafe($change->requester?->name ?? 'N/A'),
                    $this->csvSafe($change->assignedEngineer?->name ?? 'Unassigned'),
                    $change->created_at?->format('Y-m-d H:i') ?? '',
                    $change->scheduled_start_date?->format('Y-m-d H:i') ?? '',
                    $change->scheduled_end_date?->format('Y-m-d H:i') ?? '',
                    $change->approved_at?->format('Y-m-d H:i') ?? '',
                    $change->updated_at?->format('Y-m-d H:i') ?? '',
                ]);
            }

            fclose($file);
        }, 200, $csvHeaders);
    }

    /**
     * Sanitize a value to prevent CSV formula injection.
     * Prefixes cells starting with =, +, -, @, or tab with a single-quote.
     */
    private function csvSafe(?string $value): string
    {
        if ($value === null || $value === '') {
            return '';
        }

        if (preg_match('/^\s*[=+\-@\t]/', $value)) {
            return "'" . $value;
        }

        return $value;
    }

    /**
     * Export CAB review history to CSV
     */
    public function cabHistory(Request $request, WorkflowService $workflowService): StreamedResponse
    {
        $this->authorize('changes.view');

        $fromDate = $request->filled('from_date') ? Carbon::parse($request->input('from_date')) : null;
        $toDate = $request->filled('to_date') ? Carbon::parse($request->input('to_date')) : null;

        $changes = $workflowService->getCabExportData($fromDate, $toDate);

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="cab_history_' . now()->format('Y-m-d') . '.csv"',
        ];

        return response()->stream(function () use ($changes) {
            $file = fopen('php://output', 'w');

            fputcsv($file, [
                'Meeting Date',
                'Change ID',
                'Title',
                'Client',
                'Priority',
                'Risk Level',
                'Change Type',
                'Status',
                'CAB Decision',
                'Total Votes',
                'Approves',
                'Rejects',
                'Abstains',
                'CAB Conditions',
                'Requester',
                'Last Vote Date',
            ]);

            foreach ($changes as $change) {
                $votes = $change->cabVotes;
                $latestVote = $votes->sortByDesc(fn ($v) => $v->updated_at?->timestamp ?? 0)->first();

                $decision = 'pending';
                if ($change->status === ChangeRequest::STATUS_APPROVED) {
                    $decision = 'approved';
                } elseif (in_array($change->status, [
                    ChangeRequest::STATUS_CANCELLED,
                    ChangeRequest::STATUS_REJECTED,
                ], true)) {
                    $decision = 'rejected';
                }

                fputcsv($file, [
                    $change->cabMeetings->first()?->meeting_date?->format('Y-m-d') ?? '',
                    $this->csvSafe($change->change_id),
                    $this->csvSafe($change->title),
                    $this->csvSafe($change->client?->name ?? 'N/A'),
                    $change->priority,
                    $change->risk_level ?? '',
                    $change->change_type ?? '',
                    $change->status,
                    $decision,
                    $votes->count(),
                    $votes->where('vote', 'approve')->count(),
                    $votes->where('vote', 'reject')->count(),
                    $votes->where('vote', 'abstain')->count(),
                    $this->csvSafe($change->cab_conditions ?? ''),
                    $this->csvSafe($change->requester?->name ?? 'N/A'),
                    $latestVote?->updated_at?->format('Y-m-d H:i') ?? '',
                ]);
            }

            fclose($file);
        }, 200, $headers);
    }

    /**
     * Print view for a change request
     */
    public function printChange(ChangeRequest $change): Response
    {
        $this->authorize('view', $change);

        $change->load(['client', 'requester', 'assignedEngineer', 'approvals', 'auditEvents.user']);

        return response()->view('changes.print', [
            'change' => $change,
        ]);
    }
}
