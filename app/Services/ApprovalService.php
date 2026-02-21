<?php

namespace App\Services;

use App\Models\Approval;
use App\Models\CabVote;
use App\Models\ChangeRequest;
use App\Models\ClientContact;
use App\Models\User;
use App\Notifications\ApprovalRequestNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ApprovalService
{
    // Minimum CAB members required for a valid vote
    const MIN_CAB_QUORUM = 3;

    public function __construct(
        private readonly ApprovalOrchestrationService $approvalOrchestrationService
    ) {}

    /**
     * Create client approval requests for a change
     */
    public function createClientApprovals(ChangeRequest $changeRequest): void
    {
        // Get approvers for the client
        $approvers = ClientContact::where('client_id', $changeRequest->client_id)
            ->where('is_approver', true)
            ->where('is_active', true)
            ->get();

        foreach ($approvers as $approver) {
            $approval = Approval::firstOrCreate([
                'change_request_id' => $changeRequest->id,
                'client_contact_id' => $approver->id,
                'type' => Approval::TYPE_CLIENT,
            ], [
                'status' => Approval::STATUS_PENDING,
            ]);

            if ($approval->wasRecentlyCreated) {
                $this->approvalOrchestrationService->initializeApprovalSla($approval);
                $approver->notify(new ApprovalRequestNotification($approval));
            } elseif ($approval->due_at === null) {
                $this->approvalOrchestrationService->initializeApprovalSla($approval);
            }
        }
    }

    /**
     * Client approves a change request
     */
    public function clientApprove(ChangeRequest $changeRequest, ClientContact $contact, ?string $comments = null): void
    {
        DB::transaction(function () use ($changeRequest, $contact, $comments) {
            $approval = Approval::where('change_request_id', $changeRequest->id)
                ->where('client_contact_id', $contact->id)
                ->where('type', Approval::TYPE_CLIENT)
                ->firstOrFail();

            $approval->approve($comments);

            // Check if all client approvals are complete
            $this->checkClientApprovalsComplete($changeRequest);

            // Log the event
            $changeRequest->logEvent(
                'client_approved',
                "Approved by {$contact->name}" . ($comments ? ": {$comments}" : ''),
                null
            );
        });
    }

    /**
     * Ensure a CAB approval tracker exists for a change request.
     */
    public function ensureCabApproval(ChangeRequest $changeRequest): void
    {
        $approval = Approval::firstOrCreate([
            'change_request_id' => $changeRequest->id,
            'type' => Approval::TYPE_CAB,
        ], [
            'status' => Approval::STATUS_PENDING,
        ]);

        if ($approval->due_at === null) {
            $this->approvalOrchestrationService->initializeApprovalSla($approval, 48);
        }
    }

    /**
     * Client rejects a change request
     */
    public function clientReject(ChangeRequest $changeRequest, ClientContact $contact, ?string $comments = null): void
    {
        DB::transaction(function () use ($changeRequest, $contact, $comments) {
            $approval = Approval::where('change_request_id', $changeRequest->id)
                ->where('client_contact_id', $contact->id)
                ->where('type', Approval::TYPE_CLIENT)
                ->firstOrFail();

            $approval->reject($comments);

            // Reject the change request so it can be revised and resubmitted
            $changeRequest->update([
                'status' => ChangeRequest::STATUS_REJECTED,
                'rejection_reason' => $comments ?? 'Rejected by client approver',
            ]);

            $changeRequest->logEvent(
                'client_rejected',
                "Rejected by {$contact->name}" . ($comments ? ": {$comments}" : ''),
                null
            );
        });
    }

    /**
     * CAB member casts a vote
     */
    public function castCabVote(
        ChangeRequest $changeRequest,
        User $user,
        string $vote,
        ?string $comments = null,
        ?string $conditionalTerms = null
    ): void
    {
        DB::transaction(function () use ($changeRequest, $user, $vote, $comments, $conditionalTerms) {
            // Validate user has CAB Member role
            if (!$user->hasRole('CAB Member')) {
                throw new \Exception('User is not a CAB member');
            }

            // Segregation of duties: requester cannot cast CAB decision on own change.
            if ($changeRequest->requester_id === $user->id) {
                throw new \Exception('Requester cannot cast CAB vote on their own change request.');
            }

            CabVote::updateOrCreate(
                [
                    'change_request_id' => $changeRequest->id,
                    'user_id' => $user->id,
                ],
                [
                    'vote' => $vote,
                    'comments' => $comments,
                    'conditional_terms' => $conditionalTerms,
                ]
            );

            // Check if CAB quorum is reached
            $this->checkCabQuorum($changeRequest);

            $changeRequest->logEvent(
                'cab_vote_cast',
                "CAB vote: {$vote} by {$user->name}" . ($conditionalTerms ? " with conditions: {$conditionalTerms}" : ''),
                $user->id
            );
        });
    }

    /**
     * Check if all client approvals are complete
     */
    public function checkClientApprovalsComplete(ChangeRequest $changeRequest): void
    {
        $pendingCount = Approval::where('change_request_id', $changeRequest->id)
            ->where('type', Approval::TYPE_CLIENT)
            ->where('status', Approval::STATUS_PENDING)
            ->count();

        if ($pendingCount === 0) {
            // All clients have responded, check if any approved
            $approvedCount = Approval::where('change_request_id', $changeRequest->id)
                ->where('type', Approval::TYPE_CLIENT)
                ->where('status', Approval::STATUS_APPROVED)
                ->count();

            if ($approvedCount > 0) {
                if ($changeRequest->requires_cab_approval) {
                    // Move to pending CAB approval
                    $changeRequest->update(['status' => ChangeRequest::STATUS_PENDING_APPROVAL]);
                    $this->ensureCabApproval($changeRequest);
                } else {
                    $changeRequest->update([
                        'status' => ChangeRequest::STATUS_APPROVED,
                        'approved_at' => now(),
                    ]);
                }
            }
        }
    }

    /**
     * Check if CAB quorum is reached and determine outcome
     */
    public function checkCabQuorum(ChangeRequest $changeRequest): void
    {
        $votes = CabVote::with('user:id,name')
            ->where('change_request_id', $changeRequest->id)
            ->get();
        
        if ($votes->count() < self::MIN_CAB_QUORUM) {
            return; // Not enough votes yet
        }

        $approves = $votes->where('vote', CabVote::VOTE_APPROVE)->count();
        $rejects = $votes->where('vote', CabVote::VOTE_REJECT)->count();

        // Simple majority wins
        if ($approves > $rejects) {
            $conditionalVotes = $votes
                ->where('vote', CabVote::VOTE_APPROVE)
                ->filter(fn (CabVote $vote) => !empty($vote->conditional_terms));

            if ($conditionalVotes->isNotEmpty()) {
                $conditions = $conditionalVotes
                    ->map(fn (CabVote $vote) => ($vote->user?->name ?? 'CAB Member') . ': ' . trim((string) $vote->conditional_terms))
                    ->unique()
                    ->implode(PHP_EOL);

                $this->approveWithConditions($changeRequest, $conditions);
            } else {
                $this->approveChange($changeRequest);
            }
        } elseif ($rejects > $approves) {
            $this->rejectChange($changeRequest);
        }
        // Tie = no action, wait for more votes
    }

    /**
     * Approve change request after CAB vote
     */
    public function approveChange(ChangeRequest $changeRequest): void
    {
        $changeRequest->update([
            'status' => ChangeRequest::STATUS_APPROVED,
            'approved_at' => now(),
            'cab_conditions' => null,
            'cab_conditions_status' => null,
            'cab_conditions_confirmed_at' => null,
            'cab_conditions_confirmed_by' => null,
        ]);

        Approval::where('change_request_id', $changeRequest->id)
            ->where('type', Approval::TYPE_CAB)
            ->update([
                'status' => Approval::STATUS_APPROVED,
                'responded_at' => now(),
            ]);

        $changeRequest->logEvent('cab_approved', 'Change approved by CAB vote');
    }

    /**
     * Approve a change request with CAB conditions that require requester confirmation.
     */
    public function approveWithConditions(ChangeRequest $changeRequest, string $conditions): void
    {
        $changeRequest->update([
            'status' => ChangeRequest::STATUS_APPROVED,
            'approved_at' => now(),
            'cab_conditions' => $conditions,
            'cab_conditions_status' => ChangeRequest::CAB_CONDITIONS_PENDING,
            'cab_conditions_confirmed_at' => null,
            'cab_conditions_confirmed_by' => null,
        ]);

        Approval::where('change_request_id', $changeRequest->id)
            ->where('type', Approval::TYPE_CAB)
            ->update([
                'status' => Approval::STATUS_APPROVED,
                'responded_at' => now(),
            ]);

        $changeRequest->logEvent(
            'cab_approved_with_conditions',
            'Change approved by CAB with conditions pending requester confirmation.'
        );
    }

    /**
     * Reject change request after CAB vote
     */
    public function rejectChange(ChangeRequest $changeRequest): void
    {
        $changeRequest->update([
            'status' => ChangeRequest::STATUS_REJECTED,
            'rejection_reason' => 'Rejected by CAB vote',
            'cab_conditions' => null,
            'cab_conditions_status' => null,
            'cab_conditions_confirmed_at' => null,
            'cab_conditions_confirmed_by' => null,
        ]);

        Approval::where('change_request_id', $changeRequest->id)
            ->where('type', Approval::TYPE_CAB)
            ->update([
                'status' => Approval::STATUS_REJECTED,
                'responded_at' => now(),
            ]);

        $changeRequest->logEvent('cab_rejected', 'Change rejected by CAB vote');
    }

    /**
     * Requester confirms CAB conditions.
     */
    public function confirmCabConditions(ChangeRequest $changeRequest, User $user): void
    {
        if (!$changeRequest->hasPendingCabConditions()) {
            throw new \Exception('No pending CAB conditions to confirm.');
        }

        $changeRequest->update([
            'cab_conditions_status' => ChangeRequest::CAB_CONDITIONS_CONFIRMED,
            'cab_conditions_confirmed_at' => now(),
            'cab_conditions_confirmed_by' => $user->id,
        ]);

        $changeRequest->logEvent(
            'cab_conditions_confirmed',
            'Requester confirmed CAB conditions.',
            $user->id
        );
    }

    /**
     * Get all pending approvals for a client contact
     */
    public function getPendingForClient(ClientContact $contact): Collection
    {
        return Approval::with(['changeRequest.client', 'changeRequest.requester'])
            ->where('client_contact_id', $contact->id)
            ->where('status', Approval::STATUS_PENDING)
            ->get();
    }

    /**
     * Get all approvals for a client contact
     */
    public function getAllForClient(ClientContact $contact): Collection
    {
        return Approval::with(['changeRequest.client', 'changeRequest.requester'])
            ->where('client_contact_id', $contact->id)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get CAB voting summary for a change request
     */
    public function getCabVoteSummary(ChangeRequest $changeRequest): array
    {
        $votes = CabVote::where('change_request_id', $changeRequest->id)->get();
        
        return [
            'total_votes' => $votes->count(),
            'approves' => $votes->where('vote', CabVote::VOTE_APPROVE)->count(),
            'rejects' => $votes->where('vote', CabVote::VOTE_REJECT)->count(),
            'abstains' => $votes->where('vote', CabVote::VOTE_ABSTAIN)->count(),
            'quorum_met' => $votes->count() >= self::MIN_CAB_QUORUM,
            'votes' => $votes->map(fn($v) => [
                'user' => $v->user?->name ?? 'Unknown',
                'vote' => $v->vote,
                'comments' => $v->comments,
                'conditional_terms' => $v->conditional_terms,
            ]),
        ];
    }
}
