<?php

namespace App\Http\Controllers;

use App\Models\ChangeRequest;
use App\Services\DashboardService;
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
     * Export changes to CSV
     */
    public function changes(Request $request): StreamedResponse
    {
        $this->authorize('changes.view');

        $filters = $request->only(['status', 'client_id', 'from_date', 'to_date']);
        $changes = $this->dashboardService->getExportData($filters);

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="changes_' . now()->format('Y-m-d') . '.csv"',
        ];

        return response()->stream(function () use ($changes) {
            $file = fopen('php://output', 'w');

            // Headers
            fputcsv($file, [
                'Change ID',
                'Title',
                'Client',
                'Status',
                'Priority',
                'Requester',
                'Assigned Engineer',
                'Created At',
                'Scheduled Start',
                'Scheduled End',
                'Approved At',
            ]);

            foreach ($changes as $change) {
                fputcsv($file, [
                    $this->csvSafe($change->change_id),
                    $this->csvSafe($change->title),
                    $this->csvSafe($change->client?->name ?? 'N/A'),
                    $change->status,
                    $change->priority,
                    $this->csvSafe($change->requester?->name ?? 'N/A'),
                    $this->csvSafe($change->assignedEngineer?->name ?? 'Unassigned'),
                    $change->created_at?->format('Y-m-d H:i') ?? '',
                    $change->scheduled_start_date?->format('Y-m-d H:i') ?? '',
                    $change->scheduled_end_date?->format('Y-m-d H:i') ?? '',
                    $change->approved_at?->format('Y-m-d H:i') ?? '',
                ]);
            }

            fclose($file);
        }, 200, $headers);
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

        if (preg_match('/^[=+\-@\t]/', $value)) {
            return "'" . $value;
        }

        return $value;
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
