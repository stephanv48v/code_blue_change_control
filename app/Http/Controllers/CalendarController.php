<?php

namespace App\Http\Controllers;

use App\Models\ChangeRequest;
use App\Models\Client;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function index(Request $request): Response
    {
        $request->validate([
            'view' => 'nullable|in:month,week,day',
            'date' => 'nullable|date',
            'status' => 'nullable|string|max:200',
            'engineer' => 'nullable|string|max:200',
            'client' => 'nullable|integer|exists:clients,id',
            'priority' => 'nullable|string|max:200',
        ]);

        $view = $request->input('view', 'month');
        $date = $request->input('date', now()->toDateString());

        $anchor = Carbon::parse($date);

        // Compute window based on view
        if ($view === 'month') {
            $windowStart = $anchor->copy()->startOfMonth()->subWeek();
            $windowEnd = $anchor->copy()->endOfMonth()->addWeek();
        } elseif ($view === 'day') {
            $windowStart = $anchor->copy()->startOfDay();
            $windowEnd = $anchor->copy()->endOfDay();
        } else {
            // week (default) — load a 5-week buffer for smooth navigation
            $windowStart = $anchor->copy()->startOfWeek(Carbon::MONDAY)->subWeeks(2);
            $windowEnd = $anchor->copy()->endOfWeek(Carbon::SUNDAY)->addWeeks(2);
        }

        $query = ChangeRequest::query()
            ->with([
                'client:id,name',
                'requester:id,name',
                'assignedEngineer:id,name',
            ])
            ->whereNotNull('scheduled_start_date')
            ->where('scheduled_start_date', '<=', $windowEnd)
            ->where(function ($q) use ($windowStart) {
                $q->where('scheduled_end_date', '>=', $windowStart)
                    ->orWhereNull('scheduled_end_date');
            });

        // Status filter
        if ($request->filled('status')) {
            $statuses = array_filter(explode(',', $request->input('status')));
            if (! empty($statuses)) {
                $query->whereIn('status', $statuses);
            }
        } else {
            // Default: show scheduled + in_progress
            $query->whereIn('status', [
                ChangeRequest::STATUS_SCHEDULED,
                ChangeRequest::STATUS_IN_PROGRESS,
            ]);
        }

        // Engineer filter
        if ($request->filled('engineer')) {
            $engineerIds = array_filter(explode(',', $request->input('engineer')));
            if (! empty($engineerIds)) {
                $query->whereIn('assigned_engineer_id', $engineerIds);
            }
        }

        // Client filter
        if ($request->filled('client')) {
            $query->where('client_id', $request->input('client'));
        }

        // Priority filter
        if ($request->filled('priority')) {
            $priorities = array_filter(explode(',', $request->input('priority')));
            if (! empty($priorities)) {
                $query->whereIn('priority', $priorities);
            }
        }

        $changes = $query
            ->orderBy('scheduled_start_date')
            ->get()
            ->map(fn (ChangeRequest $change) => [
                'id' => $change->id,
                'change_id' => $change->change_id,
                'title' => $change->title,
                'status' => $change->status,
                'priority' => $change->priority,
                'change_type' => $change->change_type,
                'scheduled_start_date' => $change->scheduled_start_date?->toIso8601String(),
                'scheduled_end_date' => $change->scheduled_end_date?->toIso8601String(),
                'client' => $change->client ? [
                    'id' => $change->client->id,
                    'name' => $change->client->name,
                ] : null,
                'requester' => $change->requester ? [
                    'id' => $change->requester->id,
                    'name' => $change->requester->name,
                ] : null,
                'assigned_engineer' => $change->assignedEngineer ? [
                    'id' => $change->assignedEngineer->id,
                    'name' => $change->assignedEngineer->name,
                ] : null,
            ])
            ->values();

        $engineers = User::permission('changes.edit')
            ->orderBy('name')
            ->get(['id', 'name']);

        $clients = Client::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Calendar/Index', [
            'changes' => $changes,
            'engineers' => $engineers,
            'clients' => $clients,
            'filters' => [
                'view' => $view,
                'date' => $date,
                'tab' => $request->input('tab', 'calendar'),
                'engineer' => $request->input('engineer'),
                'client' => $request->input('client'),
                'status' => $request->input('status'),
                'priority' => $request->input('priority'),
            ],
            'canCreate' => $request->user()->can('changes.create'),
        ]);
    }
}
