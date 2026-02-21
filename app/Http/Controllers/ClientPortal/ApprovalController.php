<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\ChangeRequest;
use App\Services\ApprovalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalController extends Controller
{
    public function __construct(
        private ApprovalService $approvalService
    ) {}

    /**
     * Show approval detail for client
     */
    public function show(Approval $approval): Response
    {
        $contact = Auth::guard('client')->user();
        
        if ($approval->client_contact_id !== $contact->id) {
            abort(403);
        }

        $approval->load(['changeRequest.client', 'changeRequest.requester']);

        return Inertia::render('ClientPortal/ApprovalDetail', [
            'approval' => $approval,
            'changeRequest' => $approval->changeRequest,
        ]);
    }

    /**
     * Client approves a change request
     */
    public function approve(Request $request, Approval $approval): RedirectResponse
    {
        $contact = Auth::guard('client')->user();

        if ($approval->client_contact_id !== $contact->id) {
            abort(403);
        }

        if ($approval->status !== Approval::STATUS_PENDING) {
            return redirect()->route('client.approvals')
                ->withErrors(['approval' => 'This approval has already been responded to.']);
        }

        $validated = $request->validate([
            'comments' => 'nullable|string|max:1000',
        ]);

        $this->approvalService->clientApprove(
            $approval->changeRequest,
            $contact,
            $validated['comments'] ?? null
        );

        return redirect()->route('client.approvals')
            ->with('success', 'Change request approved successfully.');
    }

    /**
     * Client rejects a change request
     */
    public function reject(Request $request, Approval $approval): RedirectResponse
    {
        $contact = Auth::guard('client')->user();

        if ($approval->client_contact_id !== $contact->id) {
            abort(403);
        }

        if ($approval->status !== Approval::STATUS_PENDING) {
            return redirect()->route('client.approvals')
                ->withErrors(['approval' => 'This approval has already been responded to.']);
        }

        $validated = $request->validate([
            'comments' => 'required|string|max:1000',
        ]);

        $this->approvalService->clientReject(
            $approval->changeRequest,
            $contact,
            $validated['comments']
        );

        return redirect()->route('client.approvals')
            ->with('success', 'Change request rejected.');
    }
}
