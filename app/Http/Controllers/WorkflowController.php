<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
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
     * Show CAB agenda — 5-tab hub with calendar, meetings, outcomes, upcoming, and history.
     */
    public function cabAgenda(Request $request): Response
    {
        $meetingDate = $request->has('date')
            ? Carbon::parse($request->query('date'))
            : now();

        $currentUser = $request->user();

        $agenda = $this->workflowService->generateCabAgenda($meetingDate);

        // Meetings data (filtered by user access)
        $meetings = $this->workflowService->getCabMeetings(24, $currentUser);

        // History data
        $history = $this->workflowService->getCabReviewHistory();

        // Per-agenda-item vote summaries for inline voting
        $approvalService = app(ApprovalService::class);

        $agendaVoteSummaries = [];
        $agendaUserVotes = [];

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

        // Available changes for meeting agendas (submitted or pending_approval)
        $availableChanges = ChangeRequest::with(['client:id,name', 'requester:id,name'])
            ->whereIn('status', [
                ChangeRequest::STATUS_SUBMITTED,
                ChangeRequest::STATUS_PENDING_APPROVAL,
            ])
            ->orderBy('created_at')
            ->get();

        // All CAB members for the invite picker
        $cabMembers = $this->getCabMembers();

        // Upcoming changes this week
        $upcomingChanges = $this->workflowService->getUpcomingChanges(
            now()->startOfWeek(),
            now()->endOfWeek()
        );

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
            'cabMembers' => $cabMembers,
            'upcomingChanges' => $upcomingChanges,
            'cabSettings' => [
                'default_meeting_time' => AppSetting::get('cab.default_meeting_time', '09:00'),
                'auto_populate_agenda' => (bool) AppSetting::get('cab.auto_populate_agenda', true),
            ],
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
        if (!$request->user()?->can('changes.approve')) {
            return back()->with('error', 'You do not have permission to manage CAB meetings.');
        }

        $validated = $request->validate([
            'meeting_date' => 'nullable|date',
            'auto_populate' => 'nullable|boolean',
            'invited_member_ids' => 'nullable|array',
            'invited_member_ids.*' => 'exists:users,id',
            'change_request_ids' => 'nullable|array',
            'change_request_ids.*' => 'exists:change_requests,id',
            'talking_points' => 'nullable|array',
            'talking_points.*.id' => 'required|string',
            'talking_points.*.text' => 'required|string|max:500',
            'talking_points.*.checked' => 'required|boolean',
        ]);

        try {
            $meetingDate = isset($validated['meeting_date'])
                ? Carbon::parse($validated['meeting_date'])
                : now();

            $autoPopulate = (bool) ($validated['auto_populate'] ?? false);

            $meeting = $this->workflowService->getOrCreateCabMeeting($meetingDate, $request->user());

            // Sync invited CAB members if provided
            if (!empty($validated['invited_member_ids'])) {
                $meeting->invitedMembers()->syncWithoutDetaching(
                    array_map('intval', $validated['invited_member_ids'])
                );
            }

            // Add selected change requests to the agenda
            if (!empty($validated['change_request_ids']) && $meeting->status === CabMeeting::STATUS_PLANNED) {
                $syncData = collect($validated['change_request_ids'])
                    ->mapWithKeys(fn ($id) => [(int) $id => ['decision' => 'pending']])
                    ->all();
                $meeting->changeRequests()->syncWithoutDetaching($syncData);
            }

            // Store talking points if provided
            if (!empty($validated['talking_points'])) {
                $meeting->update(['talking_points' => $validated['talking_points']]);
            }

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
                $message = "Meeting created for {$meeting->meeting_date->toDateString()} with {$itemCount} agenda item(s).";
            }

            return redirect()
                ->route('cab.meetings.show', $meeting)
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
        if (!$request->user()?->can('changes.approve')) {
            return back()->with('error', 'You do not have permission to update CAB meetings.');
        }

        $validated = $request->validate([
            'status' => 'required|in:planned,completed,cancelled',
            'agenda_notes' => 'nullable|string|max:5000',
            'minutes' => 'nullable|string|max:20000',
            'talking_points' => 'nullable|array',
            'talking_points.*.id' => 'required|string',
            'talking_points.*.text' => 'required|string|max:500',
            'talking_points.*.checked' => 'required|boolean',
        ]);

        $this->workflowService->updateCabMeeting($meeting, $validated, $request->user());

        return back()->with('message', 'CAB meeting updated.');
    }

    /**
     * Update talking points for a CAB meeting.
     */
    public function updateTalkingPoints(Request $request, CabMeeting $meeting): RedirectResponse
    {
        if (!$request->user()?->can('changes.approve')) {
            return back()->with('error', 'You do not have permission to update meeting talking points.');
        }

        $validated = $request->validate([
            'talking_points' => 'required|array',
            'talking_points.*.id' => 'required|string',
            'talking_points.*.text' => 'required|string|max:500',
            'talking_points.*.checked' => 'required|boolean',
        ]);

        $meeting->update(['talking_points' => $validated['talking_points']]);

        return back()->with('message', 'Talking points updated.');
    }

    /**
     * Add one or more change requests to a CAB meeting agenda.
     */
    public function addAgendaItem(Request $request, CabMeeting $meeting): RedirectResponse
    {
        if (!$request->user()?->can('changes.approve')) {
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
        if (!$request->user()?->can('changes.approve')) {
            return back()->with('error', 'You do not have permission to manage CAB meeting agendas.');
        }

        if ($meeting->status !== CabMeeting::STATUS_PLANNED) {
            return back()->with('error', 'Cannot modify the agenda of a meeting that is not in planned status.');
        }

        $meeting->changeRequests()->detach($change->id);

        return back()->with('message', "Removed {$change->change_id} from the meeting agenda.");
    }

    /**
     * Show a single CAB meeting detail page.
     */
    public function showMeeting(Request $request, CabMeeting $meeting): Response
    {
        $user = $request->user();

        if (!$this->canAccessMeeting($meeting, $user)) {
            abort(403, 'You are not invited to this meeting.');
        }

        $meeting->load([
            'creator:id,name',
            'completer:id,name',
            'invitedMembers:id,name,email',
            'changeRequests.client:id,name',
            'changeRequests.requester:id,name',
            'changeRequests.cabVotes.user:id,name',
        ]);

        $approvalService = app(ApprovalService::class);
        $voteSummaries = [];
        $userVotes = [];

        foreach ($meeting->changeRequests as $change) {
            $voteSummaries[$change->id] = $approvalService->getCabVoteSummary($change);

            $existingVote = $change->cabVotes->where('user_id', $user?->id)->first();
            $userVotes[$change->id] = $existingVote ? [
                'vote' => $existingVote->conditional_terms ? 'approve_with_conditions' : $existingVote->vote,
                'comments' => $existingVote->comments,
                'conditions' => $existingVote->conditional_terms,
            ] : null;
        }

        // Available changes not yet on this meeting
        $meetingChangeIds = $meeting->changeRequests->pluck('id')->all();
        $availableChanges = ChangeRequest::with(['client:id,name', 'requester:id,name'])
            ->whereIn('status', [
                ChangeRequest::STATUS_SUBMITTED,
                ChangeRequest::STATUS_PENDING_APPROVAL,
            ])
            ->whereNotIn('id', $meetingChangeIds)
            ->orderBy('created_at')
            ->get();

        // All CAB members for inviting more
        $cabMembers = $this->getCabMembers();

        return Inertia::render('Changes/MeetingShow', [
            'meeting' => $meeting,
            'voteSummaries' => (object) $voteSummaries,
            'userVotes' => (object) $userVotes,
            'availableChanges' => $availableChanges,
            'cabMembers' => $cabMembers,
        ]);
    }

    /**
     * Invite additional CAB members to a meeting.
     */
    public function inviteMembers(Request $request, CabMeeting $meeting): RedirectResponse
    {
        if (!$request->user()?->can('changes.approve')) {
            return back()->with('error', 'You do not have permission to manage meeting invitations.');
        }

        $validated = $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
        ]);

        $meeting->invitedMembers()->syncWithoutDetaching(
            array_map('intval', $validated['user_ids'])
        );

        $count = count($validated['user_ids']);

        return back()->with('message', "Invited {$count} member(s) to the meeting.");
    }

    private function getCabMembers(): \Illuminate\Support\Collection
    {
        if (!\Spatie\Permission\Models\Role::where('name', 'CAB Member')->where('guard_name', 'web')->exists()) {
            return collect();
        }

        return User::role('CAB Member')
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();
    }

    private function canAccessMeeting(CabMeeting $meeting, ?User $user): bool
    {
        if (!$user) {
            return false;
        }

        // Creator always has access
        if ($meeting->created_by === $user->id) {
            return true;
        }

        // Users with changes.approve always have access (managers)
        if ($user->can('changes.approve')) {
            return true;
        }

        // Check if explicitly invited
        return $meeting->invitedMembers()->where('user_id', $user->id)->exists();
    }
}
