<?php

namespace App\Http\Controllers;

use App\Models\ChangeRequest;
use App\Services\ApprovalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalController extends Controller
{
    public function __construct(
        private ApprovalService $approvalService
    ) {}

    /**
     * Show CAB voting interface
     */
    public function showCabVote(ChangeRequest $change): Response
    {
        $this->authorize('voteCab', $change);

        $change->load(['client', 'requester', 'auditEvents.user']);
        
        $voteSummary = $this->approvalService->getCabVoteSummary($change);
        
        $userVote = $change->cabVotes()
            ->where('user_id', request()->user()?->id)
            ->first();

        $userVotePayload = $userVote ? [
            'vote' => $userVote->conditional_terms
                ? 'approve_with_conditions'
                : $userVote->vote,
            'comments' => $userVote->comments,
            'conditions' => $userVote->conditional_terms,
        ] : null;

        return Inertia::render('ChangeRequests/CabVote', [
            'changeRequest' => $change,
            'voteSummary' => $voteSummary,
            'userVote' => $userVotePayload,
        ]);
    }

    /**
     * Cast CAB vote
     */
    public function castCabVote(Request $request, ChangeRequest $change): RedirectResponse
    {
        $this->authorize('voteCab', $change);

        $validated = $request->validate([
            'vote' => 'required|in:approve,approve_with_conditions,reject,abstain',
            'comments' => 'nullable|string|max:1000',
            'conditions' => 'nullable|string|max:2000|required_if:vote,approve_with_conditions',
        ]);

        $vote = $validated['vote'] === 'approve_with_conditions'
            ? 'approve'
            : $validated['vote'];

        $conditions = $validated['vote'] === 'approve_with_conditions'
            ? ($validated['conditions'] ?? null)
            : null;

        $this->approvalService->castCabVote(
            $change,
            $request->user(),
            $vote,
            $validated['comments'] ?? null,
            $conditions
        );

        return back()->with('success', 'Your vote has been recorded.');
    }

    /**
     * Get approval status for a change request
     */
    public function status(ChangeRequest $change): Response
    {
        $this->authorize('view', $change);

        $change->load(['approvals.clientContact', 'cabVotes.user']);

        return Inertia::render('ChangeRequests/Approvals', [
            'changeRequest' => $change,
            'cabSummary' => $this->approvalService->getCabVoteSummary($change),
        ]);
    }
}
