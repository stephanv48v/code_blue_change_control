<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\EntraGroupRoleMapping;
use App\Models\IntegrationConnection;
use App\Services\IntegrationProviderRegistry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class IntegrationSettingsController extends Controller
{
    public function index(IntegrationProviderRegistry $providerRegistry): Response
    {
        $connections = IntegrationConnection::query()
            ->with(['client:id,name'])
            ->withCount(['assets', 'clientMappings'])
            ->with([
                'syncRuns' => fn ($query) => $query->latest()->limit(1),
            ])
            ->latest()
            ->get();

        return Inertia::render('settings/integrations', [
            'providers'     => $providerRegistry->options(),
            'connections'   => $connections,
            'microsoftSso'  => [
                'clientId'     => config('services.microsoft.client_id') ?: '',
                'tenantId'     => config('services.microsoft.tenant') ?: '',
                'clientSecret' => ! empty(config('services.microsoft.client_secret')),
                'configured'   => ! empty(config('services.microsoft.client_id'))
                    && ! empty(config('services.microsoft.client_secret'))
                    && ! empty(config('services.microsoft.tenant')),
                'callbackUrl'  => config('app.url').'/auth/microsoft/callback',
            ],
            'groupMappings' => EntraGroupRoleMapping::orderBy('role_name')->orderBy('group_name')->get(),
            'availableRoles' => Role::where('guard_name', 'web')->orderBy('name')->pluck('name'),
        ]);
    }

    public function saveMicrosoftSso(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_id'     => 'nullable|string|max:255',
            'tenant_id'     => 'nullable|string|max:255',
            'client_secret' => 'nullable|string|max:500',
        ]);

        if (! empty($validated['client_id'])) {
            AppSetting::set('microsoft_client_id', trim($validated['client_id']));
        }

        if (! empty($validated['tenant_id'])) {
            AppSetting::set('microsoft_tenant_id', trim($validated['tenant_id']));
        }

        // Only update the secret if a new value was provided
        if (! empty($validated['client_secret'])) {
            AppSetting::set('microsoft_client_secret', encrypt(trim($validated['client_secret'])));
        }

        return back()->with('message', 'Microsoft SSO settings saved. Restart the app if changes do not take effect immediately.');
    }

    public function saveGroupMappings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'mappings'               => 'present|array',
            'mappings.*.group_id'   => 'required|string|max:36',
            'mappings.*.group_name' => 'nullable|string|max:255',
            'mappings.*.role_name'  => ['required', 'string', 'exists:roles,name'],
        ]);

        // Replace all mappings atomically within a transaction
        \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            EntraGroupRoleMapping::query()->delete();

            foreach ($validated['mappings'] as $mapping) {
                EntraGroupRoleMapping::create([
                    'group_id'   => trim($mapping['group_id']),
                    'group_name' => isset($mapping['group_name']) ? trim($mapping['group_name']) : null,
                    'role_name'  => $mapping['role_name'],
                ]);
            }
        });

        return back()->with('message', 'Group role mappings saved successfully.');
    }
}
