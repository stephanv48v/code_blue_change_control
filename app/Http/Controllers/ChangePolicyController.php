<?php

namespace App\Http\Controllers;

use App\Models\BlackoutWindow;
use App\Models\ChangePolicy;
use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChangePolicyController extends Controller
{
    public function index(): Response
    {
        $policies = ChangePolicy::query()
            ->with(['client:id,name', 'creator:id,name'])
            ->orderByDesc('client_id')
            ->orderBy('name')
            ->get();

        $blackoutWindows = BlackoutWindow::query()
            ->with(['client:id,name', 'creator:id,name'])
            ->orderByDesc('starts_at')
            ->get();

        $clients = Client::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Governance/Index', [
            'policies' => $policies,
            'blackoutWindows' => $blackoutWindows,
            'clients' => $clients,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'client_id' => ['nullable', 'exists:clients,id'],
            'change_type' => ['nullable', 'in:standard,normal,emergency,network,server_cloud,identity_access,security_patch'],
            'priority' => ['nullable', 'in:low,medium,high,critical'],
            'min_risk_score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'max_risk_score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'requires_client_approval' => ['boolean'],
            'requires_cab_approval' => ['boolean'],
            'requires_security_review' => ['boolean'],
            'auto_approve' => ['boolean'],
            'max_implementation_hours' => ['nullable', 'integer', 'min:1', 'max:720'],
            'rules' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ]);

        $validated['created_by'] = $request->user()->id;
        $validated['requires_client_approval'] = (bool) ($validated['requires_client_approval'] ?? true);
        $validated['requires_cab_approval'] = (bool) ($validated['requires_cab_approval'] ?? false);
        $validated['requires_security_review'] = (bool) ($validated['requires_security_review'] ?? false);
        $validated['auto_approve'] = (bool) ($validated['auto_approve'] ?? false);
        $validated['is_active'] = (bool) ($validated['is_active'] ?? true);

        ChangePolicy::create($validated);

        return back()->with('message', 'Policy created successfully.');
    }

    public function update(Request $request, ChangePolicy $policy): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'client_id' => ['nullable', 'exists:clients,id'],
            'change_type' => ['nullable', 'in:standard,normal,emergency,network,server_cloud,identity_access,security_patch'],
            'priority' => ['nullable', 'in:low,medium,high,critical'],
            'min_risk_score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'max_risk_score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'requires_client_approval' => ['boolean'],
            'requires_cab_approval' => ['boolean'],
            'requires_security_review' => ['boolean'],
            'auto_approve' => ['boolean'],
            'max_implementation_hours' => ['nullable', 'integer', 'min:1', 'max:720'],
            'rules' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ]);

        $validated['requires_client_approval'] = (bool) ($validated['requires_client_approval'] ?? true);
        $validated['requires_cab_approval'] = (bool) ($validated['requires_cab_approval'] ?? false);
        $validated['requires_security_review'] = (bool) ($validated['requires_security_review'] ?? false);
        $validated['auto_approve'] = (bool) ($validated['auto_approve'] ?? false);
        $validated['is_active'] = (bool) ($validated['is_active'] ?? true);

        $policy->update($validated);

        return back()->with('message', 'Policy updated successfully.');
    }

    public function destroy(ChangePolicy $policy): RedirectResponse
    {
        $policy->delete();

        return back()->with('message', 'Policy deleted successfully.');
    }

    public function storeBlackout(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'client_id' => ['nullable', 'exists:clients,id'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'recurring_rule' => ['nullable', 'string', 'max:255'],
            'reason' => ['nullable', 'string'],
            'rules' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ]);

        $validated['created_by'] = $request->user()->id;
        $validated['timezone'] = $validated['timezone'] ?? 'UTC';
        $validated['is_active'] = (bool) ($validated['is_active'] ?? true);

        BlackoutWindow::create($validated);

        return back()->with('message', 'Blackout window created successfully.');
    }

    public function updateBlackout(Request $request, BlackoutWindow $blackout): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'client_id' => ['nullable', 'exists:clients,id'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'recurring_rule' => ['nullable', 'string', 'max:255'],
            'reason' => ['nullable', 'string'],
            'rules' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ]);

        $validated['timezone'] = $validated['timezone'] ?? 'UTC';
        $validated['is_active'] = (bool) ($validated['is_active'] ?? true);

        $blackout->update($validated);

        return back()->with('message', 'Blackout window updated successfully.');
    }

    public function destroyBlackout(BlackoutWindow $blackout): RedirectResponse
    {
        $blackout->delete();

        return back()->with('message', 'Blackout window deleted successfully.');
    }
}
