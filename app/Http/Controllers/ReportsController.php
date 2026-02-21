<?php

namespace App\Http\Controllers;

use App\Models\Approval;
use App\Models\ChangeRequest;
use App\Models\Client;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportsController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('changes.view');

        $now    = Carbon::now();
        $month  = $now->startOfMonth()->toDateTimeString();
        $last30 = $now->copy()->subDays(30)->toDateTimeString();

        // ── Status breakdown (all time) ──────────────────────────────────────
        $byStatus = ChangeRequest::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $statusOrder = [
            'draft', 'submitted', 'pending_approval', 'approved',
            'rejected', 'scheduled', 'in_progress', 'completed', 'cancelled',
        ];

        $statusData = [];
        foreach ($statusOrder as $s) {
            $statusData[$s] = $byStatus[$s] ?? 0;
        }

        $totalChanges    = array_sum($statusData);
        $completedCount  = $statusData['completed'] ?? 0;
        $approvedCount   = $statusData['approved'] ?? 0;
        $rejectedCount   = $statusData['rejected'] ?? 0;
        $inProgressCount = $statusData['in_progress'] ?? 0;

        // ── Priority breakdown ───────────────────────────────────────────────
        $byPriority = ChangeRequest::query()
            ->select('priority', DB::raw('count(*) as total'))
            ->groupBy('priority')
            ->pluck('total', 'priority')
            ->toArray();

        // ── Change type breakdown ────────────────────────────────────────────
        $byType = ChangeRequest::query()
            ->select('change_type', DB::raw('count(*) as total'))
            ->groupBy('change_type')
            ->orderByDesc('total')
            ->pluck('total', 'change_type')
            ->toArray();

        // ── Risk level breakdown ─────────────────────────────────────────────
        $byRisk = ChangeRequest::query()
            ->select('risk_level', DB::raw('count(*) as total'))
            ->groupBy('risk_level')
            ->pluck('total', 'risk_level')
            ->toArray();

        // ── Approval rate ────────────────────────────────────────────────────
        $totalDecided  = $approvedCount + $rejectedCount;
        $approvalRate  = $totalDecided > 0 ? round($approvedCount / $totalDecided * 100) : null;

        // ── Completion rate ──────────────────────────────────────────────────
        $completionRate = $totalChanges > 0 ? round($completedCount / $totalChanges * 100) : null;

        // ── High/critical rate ───────────────────────────────────────────────
        $highCritical     = ($byPriority['high'] ?? 0) + ($byPriority['critical'] ?? 0);
        $highCriticalRate = $totalChanges > 0 ? round($highCritical / $totalChanges * 100) : null;

        // ── Top clients by change count ──────────────────────────────────────
        $topClients = ChangeRequest::query()
            ->select('client_id', DB::raw('count(*) as total'))
            ->whereNotNull('client_id')
            ->groupBy('client_id')
            ->orderByDesc('total')
            ->limit(8)
            ->with('client:id,name')
            ->get()
            ->map(fn ($row) => [
                'client' => $row->client?->name ?? 'Unknown',
                'total'  => $row->total,
            ])
            ->toArray();

        // ── Monthly trend (last 6 months) ────────────────────────────────────
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $start = Carbon::now()->subMonths($i)->startOfMonth();
            $end   = Carbon::now()->subMonths($i)->endOfMonth();
            $label = $start->format('M y');

            $monthlyTrend[] = [
                'month'     => $label,
                'total'     => ChangeRequest::whereBetween('created_at', [$start, $end])->count(),
                'completed' => ChangeRequest::whereBetween('created_at', [$start, $end])
                    ->where('status', 'completed')->count(),
            ];
        }

        // ── This month stats ─────────────────────────────────────────────────
        $thisMonthStart = Carbon::now()->startOfMonth();
        $thisMonthStats = [
            'new'       => ChangeRequest::where('created_at', '>=', $thisMonthStart)->count(),
            'completed' => ChangeRequest::where('created_at', '>=', $thisMonthStart)
                ->where('status', 'completed')->count(),
            'pending'   => ChangeRequest::where('created_at', '>=', $thisMonthStart)
                ->whereIn('status', ['submitted', 'pending_approval'])->count(),
            'emergency' => ChangeRequest::where('created_at', '>=', $thisMonthStart)
                ->where('change_type', 'emergency')->count(),
        ];

        return Inertia::render('Reports/Index', [
            'stats' => [
                'totalChanges'    => $totalChanges,
                'completedCount'  => $completedCount,
                'approvedCount'   => $approvedCount,
                'rejectedCount'   => $rejectedCount,
                'inProgressCount' => $inProgressCount,
                'approvalRate'    => $approvalRate,
                'completionRate'  => $completionRate,
                'highCriticalRate'=> $highCriticalRate,
                'highCritical'    => $highCritical,
            ],
            'byStatus'     => $statusData,
            'byPriority'   => $byPriority,
            'byType'       => $byType,
            'byRisk'       => $byRisk,
            'topClients'   => $topClients,
            'monthlyTrend' => $monthlyTrend,
            'thisMonth'    => $thisMonthStats,
        ]);
    }
}
