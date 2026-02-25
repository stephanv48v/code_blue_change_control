<?php

namespace App\Services;

use App\Models\Approval;
use App\Models\CabMeeting;
use App\Models\ChangeRequest;
use App\Models\ExternalAsset;
use App\Models\WorkflowEvent;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class WorkflowService
{
    public function __construct(
        private readonly BlackoutWindowService $blackoutWindowService
    ) {}

    /**
     * Valid status transitions
     */
    private const VALID_TRANSITIONS = [
        'draft'            => ['submitted', 'cancelled'],
        'submitted'        => ['approved', 'rejected', 'cancelled'],
        'pending_approval' => ['approved', 'rejected', 'cancelled'],
        'approved'         => ['scheduled', 'cancelled'],
        'scheduled'        => ['in_progress', 'cancelled'],
        'in_progress'      => ['completed', 'cancelled'],
        'completed'        => [],
        'cancelled'        => [],
        'rejected'         => ['draft'],
    ];

    /**
     * Check if a status transition is valid
     */
    public function canTransition(ChangeRequest $change, string $newStatus): bool
    {
        $currentStatus = $change->status;
        
        if (!isset(self::VALID_TRANSITIONS[$currentStatus])) {
            return false;
        }

        return in_array($newStatus, self::VALID_TRANSITIONS[$currentStatus]);
    }

    /**
     * Transition a change request to a new status
     */
    public function transition(ChangeRequest $change, string $newStatus, ?User $user = null, ?string $reason = null): void
    {
        DB::transaction(function () use ($change, $newStatus, $user, $reason) {
            if (!$this->canTransition($change, $newStatus)) {
                throw new \Exception("Cannot transition from {$change->status} to {$newStatus}");
            }

            $oldStatus = $change->status;
            $updates = ['status' => $newStatus];

            // Set timestamps based on status
            switch ($newStatus) {
                case 'draft':
                    // Clear rejection data when moving back to draft for revision
                    $updates['rejection_reason'] = null;
                    break;
                case 'approved':
                    $updates['approved_at'] = now();
                    $updates['approved_by'] = $user?->id;
                    // Only resolve CAB approval records — client approvals require
                    // explicit bypass so the client is properly notified.
                    Approval::where('change_request_id', $change->id)
                        ->where('type', Approval::TYPE_CAB)
                        ->where('status', Approval::STATUS_PENDING)
                        ->update([
                            'status' => Approval::STATUS_APPROVED,
                            'responded_at' => now(),
                            'comments' => 'Resolved by approval transition' . ($user ? " ({$user->name})" : ''),
                        ]);
                    break;
                case 'scheduled':
                    if (!$change->scheduled_start_date) {
                        throw new \Exception('Scheduled dates must be set before scheduling');
                    }
                    break;
                case 'in_progress':
                    $updates['actual_start_date'] = now();
                    break;
                case 'completed':
                    $updates['actual_end_date'] = now();
                    break;
                case 'rejected':
                    $updates['rejection_reason'] = $reason ?? 'Rejected by ' . ($user?->name ?? 'system');
                    break;
                case 'cancelled':
                    $updates['rejection_reason'] = $reason ?? 'Cancelled by ' . ($user?->name ?? 'system');
                    break;
            }

            $change->update($updates);

            // Log the transition
            $change->logEvent(
                'status_transition',
                "Status changed from {$oldStatus} to {$newStatus}" . ($reason ? ": {$reason}" : ''),
                $user?->id
            );

            $this->publishWorkflowEvent($change, 'change.transitioned', [
                'from' => $oldStatus,
                'to' => $newStatus,
                'reason' => $reason,
            ], $user);
        });
    }

    /**
     * Schedule a change request
     */
    public function schedule(ChangeRequest $change, CarbonInterface $startDate, CarbonInterface $endDate, ?User $user = null): void
    {
        DB::transaction(function () use ($change, $startDate, $endDate, $user) {
            if (!in_array($change->status, ['approved', 'scheduled'], true)) {
                throw new \Exception('Only approved or already-scheduled changes can be scheduled.');
            }

            if ($endDate->isBefore($startDate)) {
                throw new \Exception('End date must be after start date');
            }

            $blackoutConflicts = $this->blackoutWindowService->findConflicts($change->client_id, $startDate, $endDate);

            if ($blackoutConflicts->isNotEmpty()) {
                $windowNames = $blackoutConflicts->pluck('name')->implode(', ');
                throw new \Exception("Requested schedule overlaps blackout windows: {$windowNames}");
            }

            // Check for scheduling conflicts
            $conflicts = $this->findSchedulingConflicts($change->client_id, $startDate, $endDate, $change->id);

            if ($conflicts->isNotEmpty()) {
                $conflictIds = $conflicts->pluck('change_id')->implode(', ');
                throw new \Exception("Scheduling conflicts detected with: {$conflictIds}");
            }

            // Check for asset/CI conflicts
            $assetConflicts = $this->findAssetConflicts($change, $startDate, $endDate);
            if ($assetConflicts->isNotEmpty()) {
                $conflictSummary = $assetConflicts->map(function ($conflict) {
                    return "{$conflict['asset_name']} (used by {$conflict['change_id']})";
                })->implode(', ');
                throw new \Exception("Asset scheduling conflicts detected: {$conflictSummary}");
            }

            if ($change->hasPendingCabConditions()) {
                throw new \Exception('Requester must confirm CAB conditions before scheduling.');
            }

            $change->update([
                'scheduled_start_date' => $startDate,
                'scheduled_end_date' => $endDate,
                'status' => 'scheduled',
            ]);

            $change->logEvent(
                'scheduled',
                "Scheduled from {$startDate->format('Y-m-d H:i')} to {$endDate->format('Y-m-d H:i')}",
                $user?->id
            );

            $this->publishWorkflowEvent($change, 'change.scheduled', [
                'scheduled_start_date' => $startDate->toIso8601String(),
                'scheduled_end_date' => $endDate->toIso8601String(),
            ], $user);
        });
    }

    /**
     * Find scheduling conflicts for a client
     */
    public function findSchedulingConflicts(int $clientId, CarbonInterface $startDate, CarbonInterface $endDate, ?int $excludeChangeId = null): Collection
    {
        $query = ChangeRequest::where('client_id', $clientId)
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->where(function ($q) use ($startDate, $endDate) {
                // Overlapping date ranges
                $q->whereBetween('scheduled_start_date', [$startDate, $endDate])
                  ->orWhereBetween('scheduled_end_date', [$startDate, $endDate])
                  ->orWhere(function ($sq) use ($startDate, $endDate) {
                      $sq->where('scheduled_start_date', '<=', $startDate)
                         ->where('scheduled_end_date', '>=', $endDate);
                  });
            });

        if ($excludeChangeId) {
            $query->where('id', '!=', $excludeChangeId);
        }

        return $query->get();
    }

    /**
     * Find asset/CI conflicts: other scheduled/in-progress changes that share
     * the same external assets during the given time window.
     */
    public function findAssetConflicts(ChangeRequest $change, CarbonInterface $startDate, CarbonInterface $endDate): Collection
    {
        $assetIds = $change->externalAssets()->pluck('external_assets.id');

        if ($assetIds->isEmpty()) {
            return collect();
        }

        // Find other changes that reference the same assets and have overlapping schedules
        $conflictingChanges = ChangeRequest::query()
            ->where('id', '!=', $change->id)
            ->whereIn('status', [ChangeRequest::STATUS_SCHEDULED, ChangeRequest::STATUS_IN_PROGRESS])
            ->whereHas('externalAssets', function ($query) use ($assetIds) {
                $query->whereIn('external_assets.id', $assetIds);
            })
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween('scheduled_start_date', [$startDate, $endDate])
                  ->orWhereBetween('scheduled_end_date', [$startDate, $endDate])
                  ->orWhere(function ($sq) use ($startDate, $endDate) {
                      $sq->where('scheduled_start_date', '<=', $startDate)
                         ->where('scheduled_end_date', '>=', $endDate);
                  });
            })
            ->with('externalAssets')
            ->get();

        if ($conflictingChanges->isEmpty()) {
            return collect();
        }

        // Build a detailed list of which assets conflict with which changes
        $conflicts = collect();
        foreach ($conflictingChanges as $conflicting) {
            $sharedAssets = $conflicting->externalAssets
                ->whereIn('id', $assetIds);

            foreach ($sharedAssets as $asset) {
                $conflicts->push([
                    'asset_id' => $asset->id,
                    'asset_name' => $asset->name ?? $asset->hostname ?? "Asset #{$asset->id}",
                    'change_id' => $conflicting->change_id,
                    'change_request_id' => $conflicting->id,
                    'scheduled_start' => $conflicting->scheduled_start_date?->toIso8601String(),
                    'scheduled_end' => $conflicting->scheduled_end_date?->toIso8601String(),
                ]);
            }
        }

        return $conflicts;
    }

    /**
     * Assign an engineer to a change request
     */
    public function assignEngineer(ChangeRequest $change, User $engineer, ?User $assignedBy = null): void
    {
        DB::transaction(function () use ($change, $engineer, $assignedBy) {
            if (!$engineer->hasRole('Engineer')) {
                throw new \Exception('User must have Engineer role');
            }

            if ($change->scheduled_start_date && $change->scheduled_end_date) {
                $conflicts = ChangeRequest::query()
                    ->where('assigned_engineer_id', $engineer->id)
                    ->where('id', '!=', $change->id)
                    ->whereIn('status', [ChangeRequest::STATUS_SCHEDULED, ChangeRequest::STATUS_IN_PROGRESS])
                    ->where(function ($query) use ($change) {
                        $query->whereBetween('scheduled_start_date', [
                            $change->scheduled_start_date,
                            $change->scheduled_end_date,
                        ])->orWhereBetween('scheduled_end_date', [
                            $change->scheduled_start_date,
                            $change->scheduled_end_date,
                        ])->orWhere(function ($nested) use ($change) {
                            $nested->where('scheduled_start_date', '<=', $change->scheduled_start_date)
                                ->where('scheduled_end_date', '>=', $change->scheduled_end_date);
                        });
                    })
                    ->count();

                if ($conflicts > 0) {
                    throw new \Exception('Engineer has scheduling conflicts in the selected implementation window.');
                }
            }

            $change->update(['assigned_engineer_id' => $engineer->id]);

            $change->logEvent(
                'engineer_assigned',
                "Assigned to {$engineer->name}",
                $assignedBy?->id
            );

            $this->publishWorkflowEvent($change, 'change.engineer_assigned', [
                'engineer_id' => $engineer->id,
                'engineer_name' => $engineer->name,
            ], $assignedBy);
        });
    }

    /**
     * Get upcoming changes for a date range
     */
    public function getUpcomingChanges(CarbonInterface $from, CarbonInterface $to): Collection
    {
        return ChangeRequest::with(['client', 'requester', 'assignedEngineer'])
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->whereBetween('scheduled_start_date', [$from, $to])
            ->orderBy('scheduled_start_date')
            ->get();
    }

    /**
     * Get changes pending CAB review
     */
    public function getPendingCabReview(): Collection
    {
        return ChangeRequest::with(['client', 'requester'])
            ->where('status', ChangeRequest::STATUS_PENDING_APPROVAL)
            ->where(function ($query) {
                $query->where('requires_cab_approval', true)
                    ->orWhereHas('approvals', function ($approvalQuery) {
                        $approvalQuery
                            ->where('type', Approval::TYPE_CAB)
                            ->where('status', Approval::STATUS_PENDING);
                    });
            })
            ->orderBy('created_at')
            ->get();
    }

    /**
     * Generate CAB meeting agenda
     */
    public function generateCabAgenda(CarbonInterface $meetingDate): array
    {
        $upcomingChanges = $this->getUpcomingChanges($meetingDate, $meetingDate->copy()->addWeek());
        $meeting = $this->getOrCreateCabMeeting($meetingDate);

        // Load the meeting's manually curated agenda items (not all pending changes)
        $agendaChanges = $meeting->changeRequests()
            ->with(['client', 'requester'])
            ->get();

        $calendarWindowStart = Carbon::parse($meetingDate)->startOfMonth()->subMonths(3);
        $calendarWindowEnd = Carbon::parse($meetingDate)->endOfMonth()->addMonths(9);
        $calendarMeetings = $this->getCabCalendarMeetings($calendarWindowStart, $calendarWindowEnd);

        return [
            'meeting_date' => $meetingDate->format('Y-m-d'),
            'meeting' => [
                'id' => $meeting->id,
                'status' => $meeting->status,
                'agenda_items' => $agendaChanges->count(),
            ],
            'pending_reviews' => $agendaChanges,
            'upcoming_changes' => $upcomingChanges,
            'total_pending' => $agendaChanges->count(),
            'total_upcoming' => $upcomingChanges->count(),
            'calendar_meetings' => $calendarMeetings,
        ];
    }

    public function getCabCalendarMeetings(
        CarbonInterface $from,
        CarbonInterface $to
    ): Collection {
        return CabMeeting::query()
            ->withCount('changeRequests')
            ->whereBetween('meeting_date', [$from, $to])
            ->orderBy('meeting_date')
            ->get()
            ->map(function (CabMeeting $meeting): array {
                return [
                    'id' => $meeting->id,
                    'meeting_date' => $meeting->meeting_date?->toIso8601String(),
                    'status' => $meeting->status,
                    'agenda_items' => (int) ($meeting->change_requests_count ?? 0),
                ];
            })
            ->values();
    }

    public function getOrCreateCabMeeting(CarbonInterface $meetingDate, ?User $createdBy = null): CabMeeting
    {
        $normalizedMeetingDate = Carbon::parse($meetingDate)->setTime(9, 0, 0);

        $meeting = CabMeeting::firstOrCreate(
            ['meeting_date' => $normalizedMeetingDate],
            [
                'status' => CabMeeting::STATUS_PLANNED,
                'created_by' => $createdBy?->id,
            ]
        );

        return $meeting->fresh(['changeRequests.client', 'changeRequests.requester']);
    }

    /**
     * Refresh agenda membership for a CAB meeting based on pending CAB reviews.
     *
     * @return array{added:int,removed:int,total:int,pending_available:int,updated:bool}
     */
    public function refreshCabMeetingAgenda(CabMeeting $meeting): array
    {
        $pendingChangeIds = $this->getPendingCabReview()
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        $existingChangeIds = $meeting->changeRequests()
            ->pluck('change_requests.id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        if ($meeting->status !== CabMeeting::STATUS_PLANNED) {
            return [
                'added' => 0,
                'removed' => 0,
                'total' => count($existingChangeIds),
                'pending_available' => count($pendingChangeIds),
                'updated' => false,
            ];
        }

        $meeting->changeRequests()->sync(
            collect($pendingChangeIds)->mapWithKeys(
                fn (int $id): array => [$id => ['decision' => 'pending']]
            )->all()
        );

        $updatedChangeIds = $meeting->changeRequests()
            ->pluck('change_requests.id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        return [
            'added' => count(array_diff($updatedChangeIds, $existingChangeIds)),
            'removed' => count(array_diff($existingChangeIds, $updatedChangeIds)),
            'total' => count($updatedChangeIds),
            'pending_available' => count($pendingChangeIds),
            'updated' => true,
        ];
    }

    public function getCabMeetings(int $limit = 12): Collection
    {
        return CabMeeting::query()
            ->with(['creator:id,name', 'completer:id,name', 'changeRequests:id,change_id,title,status,client_id,requester_id'])
            ->orderByDesc('meeting_date')
            ->limit($limit)
            ->get();
    }

    public function updateCabMeeting(CabMeeting $meeting, array $payload, ?User $user = null): CabMeeting
    {
        $updates = [
            'status' => $payload['status'] ?? $meeting->status,
            'agenda_notes' => $payload['agenda_notes'] ?? $meeting->agenda_notes,
            'minutes' => $payload['minutes'] ?? $meeting->minutes,
        ];

        if (($updates['status'] ?? null) === CabMeeting::STATUS_COMPLETED) {
            $updates['completed_at'] = now();
            $updates['completed_by'] = $user?->id;
        }

        $meeting->update($updates);

        return $meeting->fresh(['creator:id,name', 'completer:id,name', 'changeRequests']);
    }

    private function publishWorkflowEvent(
        ChangeRequest $change,
        string $eventType,
        array $payload = [],
        ?User $user = null
    ): WorkflowEvent {
        return WorkflowEvent::create([
            'change_request_id' => $change->id,
            'triggered_by' => $user?->id,
            'event_type' => $eventType,
            'payload' => $payload,
            'published_at' => now(),
        ]);
    }

    /**
     * Get CAB review data for CSV export, with optional date filtering.
     */
    public function getCabExportData(?CarbonInterface $fromDate = null, ?CarbonInterface $toDate = null): Collection
    {
        return ChangeRequest::withTrashed()
            ->with([
                'client:id,name',
                'requester:id,name',
                'cabVotes.user:id,name',
                'cabMeetings' => fn ($q) => $q->orderByDesc('meeting_date')->limit(1),
            ])
            ->whereHas('cabVotes', function ($q) use ($fromDate, $toDate) {
                if ($fromDate) {
                    $q->where('cab_votes.updated_at', '>=', $fromDate->startOfDay());
                }
                if ($toDate) {
                    $q->where('cab_votes.updated_at', '<=', $toDate->endOfDay());
                }
            })
            ->orderByDesc('updated_at')
            ->limit(10000)
            ->get();
    }

    /**
     * Get CAB review history, including archived changes.
     */
    public function getCabReviewHistory(int $limit = 75): Collection
    {
        return ChangeRequest::withTrashed()
            ->with(['client:id,name', 'requester:id,name', 'cabVotes.user:id,name'])
            ->whereHas('cabVotes')
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get()
            ->map(function (ChangeRequest $change): array {
                $votes = $change->cabVotes;
                $latestVote = $votes->sortByDesc(function ($vote) {
                    return $vote->updated_at?->timestamp ?? 0;
                })->first();

                $decision = 'pending';

                if ($change->status === ChangeRequest::STATUS_APPROVED) {
                    $decision = 'approved';
                } elseif (in_array($change->status, [
                    ChangeRequest::STATUS_CANCELLED,
                    ChangeRequest::STATUS_REJECTED,
                ], true)) {
                    $decision = 'rejected';
                }

                return [
                    'id' => $change->id,
                    'change_id' => $change->change_id,
                    'title' => $change->title,
                    'status' => $change->status,
                    'priority' => $change->priority,
                    'decision' => $decision,
                    'client' => [
                        'name' => $change->client?->name,
                    ],
                    'requester' => [
                        'name' => $change->requester?->name,
                    ],
                    'total_votes' => $votes->count(),
                    'approves' => $votes->where('vote', 'approve')->count(),
                    'rejects' => $votes->where('vote', 'reject')->count(),
                    'abstains' => $votes->where('vote', 'abstain')->count(),
                    'conditional_votes' => $votes
                        ->filter(fn ($vote) => !empty($vote->conditional_terms))
                        ->count(),
                    'last_voted_at' => $latestVote?->updated_at?->toISOString(),
                    'reviewed_at' => $change->approved_at?->toISOString(),
                    'cab_conditions_status' => $change->cab_conditions_status,
                    'cab_conditions_confirmed_at' => $change->cab_conditions_confirmed_at?->toISOString(),
                    'archived_at' => $change->deleted_at?->toISOString(),
                    'votes' => $votes->map(function ($vote): array {
                        return [
                            'user' => $vote->user?->name ?? 'Unknown',
                            'vote' => $vote->vote,
                            'comments' => $vote->comments,
                            'conditional_terms' => $vote->conditional_terms,
                            'voted_at' => $vote->updated_at?->toISOString(),
                        ];
                    })->values(),
                ];
            })
            ->values();
    }
}
