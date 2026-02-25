<?php

namespace App\Http\Controllers;

use App\Models\CabMeeting;
use App\Models\ChangeRequest;
use App\Models\User;
use App\Services\ApprovalService;
use App\Services\WorkflowService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowController extends Controller
{
    public function __construct(
        private WorkflowService $workflowService
    ) {}

    /**
     * Transition a change request to a new status
     */
    public function transition(Request $request, ChangeRequest $change): RedirectResponse
    {
        $this->authorize('transition', $change);

        $validated = $request->validate([
            'status' => 'required|in:draft,submitted,approved,rejected,scheduled,in_progress,completed,cancelled',
            'reason' => 'nullable|string|max:1000',
        ]);

        // Approving or rejecting requires the dedicated approve permission
        if (in_array($validated['status'], ['approved', 'rejected'], true)
            && !$request->user()->can('changes.approve')) {
            abort(403, 'You do not have permission to approve or reject change requests.');
        }

        try {
            $this->workflowService->transition(
                $change,
                $validated['status'],
                $request->user(),
                $validated['reason'] ?? null
            );

            return back()->with('message', "Change request status updated to {$validated['status']}.");
        } catch (\Exception $e) {
            return back()->withErrors(['status' => $e->getMessage()]);
        }
    }

    /**
     * Schedule a change request
     */
    public function schedule(Request $request, ChangeRequest $change): RedirectResponse
    {
        $this->authorize('schedule', $change);

        $validated = $request->validate([
            'scheduled_start_date' => 'required|date',
            'scheduled_end_date' => 'required|date|after:scheduled_start_date',
        ]);

        try {
            $this->workflowService->schedule(
                $change,
                Carbon::parse($validated['scheduled_start_date']),
                Carbon::parse($validated['scheduled_end_date']),
                $request->user()
            );

            return back()->with('message', 'Change request scheduled successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['schedule' => $e->getMessage()]);
        }
    }

    /**
     * Assign an engineer to a change request
     */
    public function assignEngineer(Request $request, ChangeRequest $change): RedirectResponse
    {
        $this->authorize('assignEngineer', $change);

        $validated = $request->validate([
            'engineer_id' => 'required|exists:users,id',
        ]);

        $engineer = User::findOrFail($validated['engineer_id']);

        try {
            $this->workflowService->assignEngineer($change, $engineer, $request->user());

            return back()->with('message', "Assigned to {$engineer->name}.");
        } catch (\Exception $e) {
            return back()->withErrors(['engineer' => $e->getMessage()]);
        }
    }

    /**
     * Get scheduling conflicts
     */
    public function conflicts(Request $request, ChangeRequest $change): Response
    {
        $this->authorize('view', $change);

        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $conflicts = $this->workflowService->findSchedulingConflicts(
            $change->client_id,
            Carbon::parse($validated['start_date']),
            Carbon::parse($validated['end_date']),
            $change->id
        );

        return Inertia::render('Changes/Conflicts', [
            'change' => $change,
            'conflicts' => $conflicts,
        ]);
    }

    /**
     * Show CAB agenda — unified hub with meetings, voting, and history.
     */
    public function cabAgenda(Request $request): Response
    {
        $meetingDate = $request->has('date')
            ? Carbon::parse($request->query('date'))
            : now();

        $agenda = $this->workflowService->generateCabAgenda($meetingDate);

        // Meetings data (for Calendar & Meetings tab)
        $meetings = $this->workflowService->getCabMeetings();

        // History data (for Review History tab)
        $history = $this->workflowService->getCabReviewHistory();

        // Per-agenda-item vote summaries for inline voting
        $approvalService = app(ApprovalService::class);
        $currentUser = request()->user();

        $agendaVoteSummaries = [];
        $agendaUserVotes = [];

        // Build vote data for all pending review items
        foreach ($agenda['pending_reviews'] as $change) {
            $change->load('cabVotes.user');
            $agendaVoteSummaries[$change->id] = $approvalService->getCabVoteSummary($change);

            $existingVote = $change->cabVotes->where('user_id', $currentUser?->id)->first();
            $agendaUserVotes[$change->id] = $existingVote ? [
                'vote' => $existingVote->conditional_terms ? 'approve_with_conditions' : $existingVote->vote,
                'comments' => $existingVote->comments,
                'conditions' => $existingVote->conditional_terms,
            ] : null;
        }

        // Available changes not yet on today's meeting agenda
        $agendaPendingIds = collect($agenda['pending_reviews'])->pluck('id')->all();
        $allPending = $this->workflowService->getPendingCabReview();
        $availableChanges = $allPending->filter(
            fn (ChangeRequest $cr) => !in_array($cr->id, $agendaPendingIds, true)
        )->values();

        return Inertia::render('Changes/CabAgenda', [
            'agenda' => $agenda,
            'meetings' => $meetings,
            'history' => $history,
            'historySummary' => [
                'total_reviewed' => $history->count(),
                'approved' => $history->where('decision', 'approved')->count(),
                'rejected' => $history->where('decision', 'rejected')->count(),
                'pending' => $history->where('decision', 'pending')->count(),
                'with_conditions' => $history->filter(
                    fn (array $item) => ($item['conditional_votes'] ?? 0) > 0
                )->count(),
            ],
            'agendaVoteSummaries' => (object) $agendaVoteSummaries,
            'agendaUserVotes' => (object) $agendaUserVotes,
            'availableChanges' => $availableChanges,
        ]);
    }

    /**
     * Show historical CAB review outcomes.
     */
    public function cabHistory(): Response
    {
        $history = $this->workflowService->getCabReviewHistory();

        return Inertia::render('Changes/CabHistory', [
            'history' => $history,
            'summary' => [
                'total_reviewed' => $history->count(),
                'approved' => $history->where('decision', 'approved')->count(),
                'rejected' => $history->where('decision', 'rejected')->count(),
                'pending' => $history->where('decision', 'pending')->count(),
                'with_conditions' => $history->filter(
                    fn (array $item) => ($item['conditional_votes'] ?? 0) > 0
                )->count(),
            ],
        ]);
    }

    /**
     * List CAB meetings and agendas.
     */
    public function cabMeetings(): Response
    {
        $meetings = $this->workflowService->getCabMeetings();

        return Inertia::render('Changes/CabMeetings', [
            'meetings' => $meetings,
        ]);
    }

    /**
     * Create a CAB meeting or refresh an existing one's agenda.
     *
     * When auto_populate is false (default for "Create Agenda"), an empty meeting
     * is created so the user can manually curate the agenda.
     * When auto_populate is true ("Refresh Agenda"), all pending changes are synced.
     */
    public function generateCabMeeting(Request $request): RedirectResponse
    {
        if (!$request->user()?->canAny(['changes.edit', 'changes.approve'])) {
            return back()->with('error', 'You do not have permission to manage CAB meetings.');
        }

        $validated = $request->validate([
            'meeting_date' => 'nullable|date',
            'auto_populate' => 'nullable|boolean',
        ]);

        try {
            $meetingDate = isset($validated['meeting_date'])
                ? Carbon::parse($validated['meeting_date'])
                : now();

            $autoPopulate = (bool) ($validated['auto_populate'] ?? false);

            $meeting = $this->workflowService->getOrCreateCabMeeting($meetingDate, $request->user());

            if ($autoPopulate) {
                $result = $this->workflowService->refreshCabMeetingAgenda($meeting);

                $message = $result['updated']
                    ? "Agenda refreshed: {$result['total']} item(s), {$result['added']} added, {$result['removed']} removed."
                    : "Meeting is not in planned state. Agenda refresh skipped.";

                if ($result['updated'] && $result['pending_available'] === 0) {
                    $message .= ' No pending CAB reviews found.';
                }
            } else {
                $itemCount = $meeting->changeRequests()->count();
                $message = "Meeting agenda created for {$meeting->meeting_date->toDateString()}. Select changes to add to the agenda.";
                if ($itemCount > 0) {
                    $message = "Meeting for {$meeting->meeting_date->toDateString()} already exists with {$itemCount} item(s). You can add or remove changes below.";
                }
            }

            return redirect()
                ->route('cab.agenda', ['date' => $meetingDate->toDateString(), 'tab' => 'today'])
                ->with('message', $message);
        } catch (\Throwable $exception) {
            report($exception);

            return back()->with('error', 'Unable to generate or refresh CAB agenda right now.');
        }
    }

    /**
     * Update CAB meeting notes/minutes/outcome.
     */
    public function updateCabMeeting(Request $request, CabMeeting $meeting): RedirectResponse
    {
        if (!$request->user()?->canAny(['changes.edit', 'changes.approve'])) {
            return back()->with('error', 'You do not have permission to update CAB meetings.');
        }

        $validated = $request->validate([
            'status' => 'required|in:planned,completed,cancelled',
            'agenda_notes' => 'nullable|string|max:5000',
            'minutes' => 'nullable|string|max:20000',
        ]);

        $this->workflowService->updateCabMeeting($meeting, $validated, $request->user());

        return back()->with('message', 'CAB meeting updated.');
    }

    /**
     * Add one or more change requests to a CAB meeting agenda.
     */
    public function addAgendaItem(Request $request, CabMeeting $meeting): RedirectResponse
    {
        if (!$request->user()?->canAny(['changes.edit', 'changes.approve'])) {
            return back()->with('error', 'You do not have permission to manage CAB meeting agendas.');
        }

        if ($meeting->status !== CabMeeting::STATUS_PLANNED) {
            return back()->with('error', 'Cannot modify the agenda of a meeting that is not in planned status.');
        }

        $validated = $request->validate([
            'change_request_ids' => 'required|array|min:1',
            'change_request_ids.*' => 'exists:change_requests,id',
        ]);

        $syncData = collect($validated['change_request_ids'])
            ->mapWithKeys(fn ($id) => [(int) $id => ['decision' => 'pending']])
            ->all();

        $meeting->changeRequests()->syncWithoutDetaching($syncData);

        $count = count($validated['change_request_ids']);

        return back()->with('message', "Added {$count} change" . ($count !== 1 ? 's' : '') . " to the meeting agenda.");
    }

    /**
     * Remove a change request from a CAB meeting agenda.
     */
    public function removeAgendaItem(Request $request, CabMeeting $meeting, ChangeRequest $change): RedirectResponse
    {
        if (!$request->user()?->canAny(['changes.edit', 'changes.approve'])) {
            return back()->with('error', 'You do not have permission to manage CAB meeting agendas.');
        }

        if ($meeting->status !== CabMeeting::STATUS_PLANNED) {
            return back()->with('error', 'Cannot modify the agenda of a meeting that is not in planned status.');
        }

        $meeting->changeRequests()->detach($change->id);

        return back()->with('message', "Removed {$change->change_id} from the meeting agenda.");
    }
}
