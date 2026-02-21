<?php

namespace App\Http\Controllers;

use App\Models\CabMeeting;
use App\Models\ChangeRequest;
use App\Models\User;
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
            'status' => 'required|in:submitted,approved,rejected,scheduled,in_progress,completed,cancelled',
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
     * Show CAB agenda
     */
    public function cabAgenda(): Response
    {
        $agenda = $this->workflowService->generateCabAgenda(now());

        return Inertia::render('Changes/CabAgenda', [
            'agenda' => $agenda,
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
     * Generate or refresh a CAB meeting agenda.
     */
    public function generateCabMeeting(Request $request): RedirectResponse
    {
        if (!$request->user()?->canAny(['changes.edit', 'changes.approve'])) {
            return back()->with('error', 'You do not have permission to manage CAB meetings.');
        }

        $validated = $request->validate([
            'meeting_date' => 'nullable|date',
        ]);

        try {
            $meetingDate = isset($validated['meeting_date'])
                ? Carbon::parse($validated['meeting_date'])
                : now();

            $meeting = $this->workflowService->getOrCreateCabMeeting($meetingDate, $request->user());
            $result = $this->workflowService->refreshCabMeetingAgenda($meeting);

            $message = $result['updated']
                ? "Agenda refreshed for {$meeting->meeting_date->toDateString()}: {$result['total']} item(s), {$result['added']} added, {$result['removed']} removed."
                : "Meeting exists but is not in planned state. Agenda refresh skipped.";

            if ($result['updated'] && $result['pending_available'] === 0) {
                $message .= ' No pending CAB reviews found.';
            }

            return redirect()
                ->route('cab.meetings')
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
}
