<?php

namespace App\Http\Controllers;

use App\Models\Approval;
use App\Models\ChangeCommunication;
use App\Models\ChangeRequest;
use App\Models\ChangeRunbookStep;
use App\Models\Client;
use App\Models\ClientContact;
use App\Models\ExternalAsset;
use App\Models\FormSchema;
use App\Models\IntegrationConnection;
use App\Models\PostImplementationReview;
use App\Models\User;
use App\Models\WorkflowEvent;
use App\Notifications\ClientApprovalBypassedNotification;
use App\Services\ApprovalService;
use App\Services\ChangePolicyEngineService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChangeRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', ChangeRequest::class);

        $query = ChangeRequest::with(['client', 'requester'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('client')) {
            $query->where('client_id', $request->input('client'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        if ($request->filled('change_type')) {
            $query->where('change_type', $request->input('change_type'));
        }

        if ($request->filled('requester')) {
            $query->where('requester_id', $request->input('requester'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('change_id', 'like', "%{$search}%");
            });
        }

        $changes = $query->paginate(10)->withQueryString();

        $clients = Client::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $requesters = User::query()
            ->whereIn('id', ChangeRequest::select('requester_id')->distinct())
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Changes/Index', [
            'changes' => $changes,
            'filters' => $request->only(['status', 'client', 'search', 'priority', 'change_type', 'requester', 'date_from', 'date_to']),
            'clients' => $clients,
            'requesters' => $requesters,
            'statuses' => [
                'draft' => 'Draft',
                'submitted' => 'Submitted',
                'pending_approval' => 'Pending Approval',
                'approved' => 'Approved',
                'rejected' => 'Rejected',
                'scheduled' => 'Scheduled',
                'in_progress' => 'In Progress',
                'completed' => 'Completed',
                'cancelled' => 'Cancelled',
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', ChangeRequest::class);

        $clients = Client::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $formSchemas = FormSchema::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'description', 'schema']);

        $assets = ExternalAsset::query()
            ->orderBy('name')
            ->get(['id', 'client_id', 'name', 'external_type', 'provider', 'status']);

        $clientApprovers = ClientContact::query()
            ->active()
            ->approvers()
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'client_id', 'first_name', 'last_name', 'email'])
            ->map(fn (ClientContact $contact) => [
                'id' => $contact->id,
                'client_id' => $contact->client_id,
                'name' => $contact->name,
                'email' => $contact->email,
            ])
            ->values();

        $hasConnectWise = IntegrationConnection::active()
            ->where('provider', IntegrationConnection::PROVIDER_CONNECTWISE)
            ->exists();

        return Inertia::render('Changes/Create', [
            'clients' => $clients,
            'formSchemas' => $formSchemas,
            'assets' => $assets,
            'clientApprovers' => $clientApprovers,
            'hasConnectWise' => $hasConnectWise,
        ]);
    }

    public function store(Request $request, ChangePolicyEngineService $policyEngine)
    {
        $this->authorize('create', ChangeRequest::class);

        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['required', 'in:low,medium,high,critical'],
            'change_type' => ['nullable', 'in:standard,normal,emergency,network,server_cloud,identity_access,security_patch'],
            'risk_level' => ['nullable', 'in:low,medium,high'],
            'form_schema_id' => ['nullable', 'exists:form_schemas,id'],
            'form_data' => ['nullable', 'array'],
            'external_asset_ids' => ['nullable', 'array'],
            'external_asset_ids.*' => ['integer', 'exists:external_assets,id'],
            'requested_date' => ['nullable', 'date'],
            'implementation_plan' => ['nullable', 'string'],
            'backout_plan' => ['nullable', 'string'],
            'test_plan' => ['nullable', 'string'],
            'business_justification' => ['nullable', 'string'],
        ]);

        $policyDecision = $policyEngine->evaluate($validated);

        $validated['requester_id'] = $request->user()->id;
        $validated['status'] = 'draft';
        $validated['risk_score'] = $policyDecision['risk_score'];
        $validated['requires_cab_approval'] = $policyDecision['requires_cab_approval'];
        $validated['policy_decision'] = $policyDecision;

        $assetIds = $validated['external_asset_ids'] ?? [];
        unset($validated['external_asset_ids']);

        $changeRequest = ChangeRequest::create($validated);

        if (!empty($assetIds)) {
            $changeRequest->externalAssets()->sync(
                collect($assetIds)->mapWithKeys(
                    fn ($assetId) => [$assetId => ['relationship_type' => 'impacted']]
                )->all()
            );
        }

        // Log the creation
        \App\Models\AuditEvent::log($changeRequest, 'created', null, $changeRequest->toArray());

        return redirect()->route('changes.show', $changeRequest)
            ->with('message', 'Change request created successfully.');
    }

    public function show(ChangeRequest $change): Response
    {
        $this->authorize('view', $change);

        $change->load([
            'client',
            'requester',
            'approver',
            'cabApprover',
            'assignedEngineer:id,name',
            'formSchema',
            'externalAssets',
            'approvals.clientContact',
            'cabVotes.user',
            'runbookSteps.completedBy',
            'communications.author',
            'postImplementationReview.reviewer',
            'workflowEvents.publisher',
        ]);

        $engineers = User::role('Engineer')
            ->orderBy('name')
            ->get(['id', 'name']);

        $voteSummary = null;
        $userVote = null;

        if (in_array($change->status, [
            ChangeRequest::STATUS_PENDING_APPROVAL,
            ChangeRequest::STATUS_APPROVED,
            ChangeRequest::STATUS_SCHEDULED,
            ChangeRequest::STATUS_IN_PROGRESS,
            ChangeRequest::STATUS_COMPLETED,
        ], true)) {
            $voteSummary = app(ApprovalService::class)->getCabVoteSummary($change);

            $existingVote = $change->cabVotes
                ->where('user_id', request()->user()?->id)
                ->first();

            if ($existingVote) {
                $userVote = [
                    'vote' => $existingVote->conditional_terms
                        ? 'approve_with_conditions'
                        : $existingVote->vote,
                    'comments' => $existingVote->comments,
                    'conditions' => $existingVote->conditional_terms,
                ];
            }
        }

        return Inertia::render('Changes/Show', [
            'change' => $change,
            'engineers' => $engineers,
            'voteSummary' => $voteSummary,
            'userVote' => $userVote,
        ]);
    }

    public function edit(ChangeRequest $change): Response
    {
        $this->authorize('update', $change);

        $clients = Client::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $formSchemas = FormSchema::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'description', 'schema']);

        $assets = ExternalAsset::query()
            ->orderBy('name')
            ->get(['id', 'client_id', 'name', 'external_type', 'provider', 'status']);

        $clientApprovers = ClientContact::query()
            ->active()
            ->approvers()
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'client_id', 'first_name', 'last_name', 'email'])
            ->map(fn (ClientContact $contact) => [
                'id' => $contact->id,
                'client_id' => $contact->client_id,
                'name' => $contact->name,
                'email' => $contact->email,
            ])
            ->values();

        $change->load('externalAssets:id,name');

        return Inertia::render('Changes/Edit', [
            'change' => $change,
            'clients' => $clients,
            'formSchemas' => $formSchemas,
            'assets' => $assets,
            'clientApprovers' => $clientApprovers,
        ]);
    }

    public function update(Request $request, ChangeRequest $change, ChangePolicyEngineService $policyEngine)
    {
        $this->authorize('update', $change);

        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['required', 'in:low,medium,high,critical'],
            'change_type' => ['nullable', 'in:standard,normal,emergency,network,server_cloud,identity_access,security_patch'],
            'risk_level' => ['nullable', 'in:low,medium,high'],
            'form_schema_id' => ['nullable', 'exists:form_schemas,id'],
            'form_data' => ['nullable', 'array'],
            'external_asset_ids' => ['nullable', 'array'],
            'external_asset_ids.*' => ['integer', 'exists:external_assets,id'],
            'requested_date' => ['nullable', 'date'],
            'implementation_plan' => ['nullable', 'string'],
            'backout_plan' => ['nullable', 'string'],
            'test_plan' => ['nullable', 'string'],
            'business_justification' => ['nullable', 'string'],
        ]);

        $policyDecision = $policyEngine->evaluate($validated);

        $validated['risk_score'] = $policyDecision['risk_score'];
        $validated['requires_cab_approval'] = $policyDecision['requires_cab_approval'];
        $validated['policy_decision'] = $policyDecision;

        $assetIds = $validated['external_asset_ids'] ?? [];
        unset($validated['external_asset_ids']);

        $oldValues = $change->toArray();
        $change->update($validated);

        $change->externalAssets()->sync(
            collect($assetIds)->mapWithKeys(
                fn ($assetId) => [$assetId => ['relationship_type' => 'impacted']]
            )->all()
        );

        // Log the update
        \App\Models\AuditEvent::log($change, 'updated', $oldValues, $change->toArray());

        return redirect()->route('changes.show', $change)
            ->with('message', 'Change request updated successfully.');
    }

    public function destroy(ChangeRequest $change)
    {
        $this->authorize('delete', $change);

        $oldValues = $change->toArray();
        $change->delete();

        \App\Models\AuditEvent::log(
            $change,
            'archived',
            $oldValues,
            ['deleted_at' => $change->deleted_at?->toISOString()],
            'Change request archived.'
        );

        return redirect()->route('changes.index')
            ->with('message', 'Change request archived successfully.');
    }

    public function submit(
        Request $request,
        ChangeRequest $change,
        ApprovalService $approvalService,
        ChangePolicyEngineService $policyEngine
    )
    {
        $this->authorize('submit', $change);

        // Re-evaluate policy at submit time
        $policyDecision = is_array($change->policy_decision) && !empty($change->policy_decision)
            ? $change->policy_decision
            : $policyEngine->evaluate($change->toArray());

        // Enforce backout plan for high-risk changes (risk_score >= 60)
        $riskScore = $policyDecision['risk_score'] ?? 0;
        if ($riskScore >= 60 && empty($change->backout_plan)) {
            return redirect()->route('changes.show', $change)
                ->with('error', 'A backout plan is required for high-risk changes (risk score ≥ 60). Please add a backout plan before submitting.');
        }

        $requiresCab = $policyDecision['requires_cab_approval'] ?? false;

        // Auto-approve low-risk standard changes
        if ($policyDecision['auto_approve'] ?? false) {
            $change->update([
                'status'                => ChangeRequest::STATUS_APPROVED,
                'risk_score'            => $policyDecision['risk_score'],
                'policy_decision'       => $policyDecision,
                'requires_cab_approval' => $requiresCab,
                'approved_by'           => $request->user()->id,
                'approved_at'           => now(),
            ]);

            \App\Models\AuditEvent::log(
                $change,
                'status_changed',
                ['status' => 'draft'],
                ['status' => 'approved'],
                'Change request auto-approved by policy.'
            );

            return redirect()->route('changes.show', $change)
                ->with('message', 'Change request auto-approved by policy.');
        }

        // Check if the client has active approvers
        $hasClientApprovers = ClientContact::where('client_id', $change->client_id)
            ->where('is_approver', true)
            ->where('is_active', true)
            ->exists();

        $requiresClient = ($policyDecision['requires_client_approval'] ?? true) && $hasClientApprovers;

        // No client approval needed (by policy or no approvers) → route to CAB or approve
        if (!$requiresClient) {
            if ($requiresCab) {
                $change->update([
                    'status'                => ChangeRequest::STATUS_PENDING_APPROVAL,
                    'risk_score'            => $policyDecision['risk_score'],
                    'policy_decision'       => $policyDecision,
                    'requires_cab_approval' => true,
                ]);

                $approvalService->ensureCabApproval($change);

                \App\Models\AuditEvent::log(
                    $change,
                    'status_changed',
                    ['status' => 'draft'],
                    ['status' => 'pending_approval'],
                    'Change request submitted. Routed to CAB approval.'
                );

                return redirect()->route('changes.show', $change)
                    ->with('message', 'Change request submitted. Awaiting CAB approval.');
            }

            // No approvals needed at all → approve immediately
            $change->update([
                'status'                => ChangeRequest::STATUS_APPROVED,
                'risk_score'            => $policyDecision['risk_score'],
                'policy_decision'       => $policyDecision,
                'requires_cab_approval' => false,
                'approved_by'           => $request->user()->id,
                'approved_at'           => now(),
            ]);

            \App\Models\AuditEvent::log(
                $change,
                'status_changed',
                ['status' => 'draft'],
                ['status' => 'approved'],
                'Change request approved — no client or CAB approval required.'
            );

            return redirect()->route('changes.show', $change)
                ->with('message', 'Change request approved. No additional approval required.');
        }

        // Client approval path: submitted, notify client approvers
        $change->update([
            'status'                => ChangeRequest::STATUS_SUBMITTED,
            'risk_score'            => $policyDecision['risk_score'],
            'policy_decision'       => $policyDecision,
            'requires_cab_approval' => $requiresCab,
        ]);

        $approvalService->createClientApprovals($change);

        \App\Models\AuditEvent::log(
            $change,
            'status_changed',
            ['status' => 'draft'],
            ['status' => 'submitted'],
            'Change request submitted for approval.'
        );

        return redirect()->route('changes.show', $change)
            ->with('message', 'Change request submitted. Awaiting approval.');
    }

    public function operations(ChangeRequest $change): Response
    {
        $this->authorize('view', $change);

        $change->load([
            'client',
            'requester',
            'assignedEngineer:id,name',
            'runbookSteps.completedBy:id,name',
            'communications.author:id,name',
            'postImplementationReview.reviewer:id,name',
            'workflowEvents.publisher:id,name',
        ]);

        $engineers = User::role('Engineer')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Changes/Operations', [
            'change' => $change,
            'engineers' => $engineers,
        ]);
    }

    public function myScheduledChanges(Request $request): Response
    {
        $user = $request->user();
        $mineOnly = ! $request->has('mine_only') || $request->boolean('mine_only');
        $windowStart = Carbon::now()->startOfMonth()->subMonths(3);
        $windowEnd = Carbon::now()->endOfMonth()->addMonths(9);

        $query = ChangeRequest::query()
            ->with([
                'client:id,name',
                'requester:id,name',
                'assignedEngineer:id,name',
            ])
            ->whereIn('status', [
                ChangeRequest::STATUS_SCHEDULED,
                ChangeRequest::STATUS_IN_PROGRESS,
            ])
            ->whereNotNull('scheduled_start_date')
            ->whereBetween('scheduled_start_date', [$windowStart, $windowEnd]);

        if ($mineOnly) {
            $query->where(function ($q) use ($user) {
                $q->where('requester_id', $user->id)
                    ->orWhere('assigned_engineer_id', $user->id);
            });
        }

        $changes = $query
            ->orderBy('scheduled_start_date')
            ->get([
                'id',
                'change_id',
                'title',
                'status',
                'priority',
                'scheduled_start_date',
                'scheduled_end_date',
                'client_id',
                'requester_id',
                'assigned_engineer_id',
            ])
            ->map(function (ChangeRequest $change) use ($user): array {
                $roles = [];

                if ($change->requester_id === $user->id) {
                    $roles[] = 'Requester';
                }

                if ($change->assigned_engineer_id === $user->id) {
                    $roles[] = 'Assigned Engineer';
                }

                return [
                    'id' => $change->id,
                    'change_id' => $change->change_id,
                    'title' => $change->title,
                    'status' => $change->status,
                    'priority' => $change->priority,
                    'scheduled_start_date' => $change->scheduled_start_date?->toIso8601String(),
                    'scheduled_end_date' => $change->scheduled_end_date?->toIso8601String(),
                    'participant_role' => implode(' & ', $roles),
                    'client' => [
                        'name' => $change->client?->name,
                    ],
                    'requester' => [
                        'name' => $change->requester?->name,
                    ],
                    'assigned_engineer' => [
                        'name' => $change->assignedEngineer?->name,
                    ],
                ];
            })
            ->values();

        return Inertia::render('Changes/MyScheduledChanges', [
            'changes' => $changes,
            'mine_only' => $mineOnly,
            'range' => [
                'from' => $windowStart->toDateString(),
                'to' => $windowEnd->toDateString(),
            ],
        ]);
    }

    public function addRunbookStep(Request $request, ChangeRequest $change): RedirectResponse
    {
        if (!$request->user()->can('changes.edit')) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'instructions' => ['nullable', 'string', 'max:5000'],
            'step_order' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ]);

        $stepOrder = $validated['step_order'] ?? (
            ((int) $change->runbookSteps()->max('step_order')) + 1
        );

        $step = $change->runbookSteps()->create([
            'title' => $validated['title'],
            'instructions' => $validated['instructions'] ?? null,
            'step_order' => $stepOrder,
            'status' => ChangeRunbookStep::STATUS_PENDING,
        ]);

        WorkflowEvent::create([
            'change_request_id' => $change->id,
            'triggered_by' => $request->user()->id,
            'event_type' => 'runbook.step_added',
            'payload' => [
                'runbook_step_id' => $step->id,
                'title' => $step->title,
                'step_order' => $step->step_order,
            ],
            'published_at' => now(),
        ]);

        \App\Models\AuditEvent::log(
            $change,
            'runbook_step_added',
            null,
            $step->toArray(),
            "Runbook step '{$step->title}' added."
        );

        return back()->with('message', 'Runbook step added.');
    }

    public function updateRunbookStep(
        Request $request,
        ChangeRequest $change,
        ChangeRunbookStep $step
    ): RedirectResponse {
        if (!$request->user()->can('changes.edit')) {
            abort(403);
        }

        if ($step->change_request_id !== $change->id) {
            abort(404);
        }

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'instructions' => ['nullable', 'string', 'max:5000'],
            'step_order' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'status' => ['nullable', 'in:pending,in_progress,completed,skipped'],
            'evidence_notes' => ['nullable', 'string', 'max:8000'],
        ]);

        $oldValues = $step->toArray();

        $updates = $validated;
        if (($validated['status'] ?? null) === ChangeRunbookStep::STATUS_COMPLETED) {
            $updates['completed_by'] = $request->user()->id;
            $updates['completed_at'] = now();
        } elseif (isset($validated['status'])) {
            $updates['completed_by'] = null;
            $updates['completed_at'] = null;
        }

        $step->update($updates);

        WorkflowEvent::create([
            'change_request_id' => $change->id,
            'triggered_by' => $request->user()->id,
            'event_type' => 'runbook.step_updated',
            'payload' => [
                'runbook_step_id' => $step->id,
                'status' => $step->status,
            ],
            'published_at' => now(),
        ]);

        \App\Models\AuditEvent::log(
            $change,
            'runbook_step_updated',
            $oldValues,
            $step->toArray(),
            "Runbook step '{$step->title}' updated."
        );

        return back()->with('message', 'Runbook step updated.');
    }

    public function recordCommunication(Request $request, ChangeRequest $change): RedirectResponse
    {
        if (!$request->user()->can('changes.edit')) {
            abort(403);
        }

        $validated = $request->validate([
            'stage' => ['required', 'in:pre_change,in_window,post_change,adhoc'],
            'channel' => ['required', 'in:email,sms,portal,teams,slack,webhook'],
            'recipients' => ['required', 'string', 'max:5000'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:20000'],
        ]);

        $recipients = collect(preg_split('/[\r\n,;]+/', $validated['recipients'] ?? ''))
            ->map(fn ($recipient) => trim((string) $recipient))
            ->filter()
            ->values()
            ->all();

        $communication = ChangeCommunication::create([
            'change_request_id' => $change->id,
            'created_by' => $request->user()->id,
            'stage' => $validated['stage'],
            'channel' => $validated['channel'],
            'recipients' => $recipients,
            'subject' => $validated['subject'] ?? null,
            'message' => $validated['message'],
            'status' => ChangeCommunication::STATUS_SENT,
            'sent_at' => now(),
        ]);

        WorkflowEvent::create([
            'change_request_id' => $change->id,
            'triggered_by' => $request->user()->id,
            'event_type' => 'change.communication_sent',
            'payload' => [
                'communication_id' => $communication->id,
                'stage' => $communication->stage,
                'channel' => $communication->channel,
                'recipient_count' => count($recipients),
            ],
            'published_at' => now(),
        ]);

        \App\Models\AuditEvent::log(
            $change,
            'change_communication_sent',
            null,
            $communication->toArray(),
            "Communication sent via {$communication->channel}."
        );

        return back()->with('message', 'Change communication recorded as sent.');
    }

    public function savePostImplementationReview(Request $request, ChangeRequest $change): RedirectResponse
    {
        if (!$request->user()->can('changes.edit')) {
            abort(403);
        }

        $validated = $request->validate([
            'outcome' => ['required', 'in:successful,partial_failure,failed,rolled_back'],
            'summary' => ['nullable', 'string', 'max:8000'],
            'lessons_learned' => ['nullable', 'string', 'max:8000'],
            'follow_up_actions' => ['nullable', 'string', 'max:8000'],
        ]);

        $review = PostImplementationReview::updateOrCreate(
            ['change_request_id' => $change->id],
            [
                'reviewed_by' => $request->user()->id,
                'outcome' => $validated['outcome'],
                'summary' => $validated['summary'] ?? null,
                'lessons_learned' => $validated['lessons_learned'] ?? null,
                'follow_up_actions' => $validated['follow_up_actions'] ?? null,
                'reviewed_at' => now(),
            ]
        );

        WorkflowEvent::create([
            'change_request_id' => $change->id,
            'triggered_by' => $request->user()->id,
            'event_type' => 'change.pir_saved',
            'payload' => [
                'pir_id' => $review->id,
                'outcome' => $review->outcome,
            ],
            'published_at' => now(),
        ]);

        \App\Models\AuditEvent::log(
            $change,
            'post_implementation_review_saved',
            null,
            $review->toArray(),
            'Post-implementation review saved.'
        );

        return back()->with('message', 'Post-implementation review saved.');
    }

    public function timeline(ChangeRequest $change): JsonResponse
    {
        $this->authorize('view', $change);

        $change->load([
            'workflowEvents.publisher:id,name',
            'communications.author:id,name',
            'runbookSteps.completedBy:id,name',
            'postImplementationReview.reviewer:id,name',
            'approvals.clientContact:id,first_name,last_name,email',
            'cabVotes.user:id,name',
        ]);

        return response()->json([
            'change' => [
                'id' => $change->id,
                'change_id' => $change->change_id,
                'title' => $change->title,
                'status' => $change->status,
            ],
            'workflow_events' => $change->workflowEvents,
            'communications' => $change->communications,
            'runbook_steps' => $change->runbookSteps,
            'post_implementation_review' => $change->postImplementationReview,
            'approvals' => $change->approvals,
            'cab_votes' => $change->cabVotes,
        ]);
    }

    public function confirmCabConditions(
        Request $request,
        ChangeRequest $change,
        ApprovalService $approvalService
    ): RedirectResponse
    {
        $this->authorize('confirmCabConditions', $change);

        $request->validate([
            'acknowledged' => ['required'],
        ]);

        $approvalService->confirmCabConditions($change, $request->user());

        return redirect()->route('changes.show', $change)
            ->with('message', 'CAB conditions acknowledged.');
    }

    public function bypassClientApproval(Request $request, ChangeRequest $change): RedirectResponse
    {
        $this->authorize('approve', $change);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:10'],
        ]);

        // Find all pending client approvals
        $pendingClientApprovals = $change->approvals()
            ->where('type', Approval::TYPE_CLIENT)
            ->where('status', Approval::STATUS_PENDING)
            ->with('clientContact')
            ->get();

        if ($pendingClientApprovals->isEmpty()) {
            return back()->with('error', 'No pending client approvals to bypass.');
        }

        $bypassedByName = $request->user()->name;
        $bypassComment = "Bypassed by {$bypassedByName}. Reason: {$validated['reason']}";

        foreach ($pendingClientApprovals as $approval) {
            $approval->approve($bypassComment);

            // Notify the client contact
            if ($approval->clientContact) {
                $approval->clientContact->notify(
                    new ClientApprovalBypassedNotification($change, $validated['reason'], $bypassedByName)
                );
            }
        }

        $change->logEvent(
            'client_approval_bypassed',
            $bypassComment,
            $request->user()->id
        );

        // Advance the workflow now that all client approvals are resolved
        app(ApprovalService::class)->checkClientApprovalsComplete($change->fresh());

        return redirect()->route('changes.show', $change)
            ->with('message', 'Client approval bypassed. The client has been notified by email.');
    }

    public function bypassCabVoting(
        Request $request,
        ChangeRequest $change,
        ApprovalService $approvalService
    ): RedirectResponse
    {
        $this->authorize('approve', $change);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:10'],
        ]);

        if ($change->status !== ChangeRequest::STATUS_PENDING_APPROVAL) {
            return back()->with('error', 'This change is not pending CAB approval.');
        }

        $approvalService->bypassCabVoting($change, $request->user(), $validated['reason']);

        return back()->with('message', 'CAB voting bypassed. The change has been approved.');
    }
}
