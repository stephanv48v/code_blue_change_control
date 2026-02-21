<?php

namespace App\Http\Controllers;

use App\Jobs\SyncIntegrationConnectionJob;
use App\Models\Client;
use App\Models\IntegrationClientMapping;
use App\Models\IntegrationConnection;
use App\Services\IntegrationProviderRegistry;
use App\Services\IntegrationSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IntegrationConnectionController extends Controller
{
    public function index(IntegrationProviderRegistry $providerRegistry): Response
    {
        $connections = IntegrationConnection::query()
            ->with(['client:id,name', 'creator:id,name'])
            ->withCount(['assets', 'clientMappings'])
            ->with([
                'syncRuns' => fn ($query) => $query->latest()->limit(1),
            ])
            ->latest()
            ->get();

        $clients = Client::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Integrations/Index', [
            'connections' => $connections,
            'providers' => $providerRegistry->options(),
            'clients' => $clients,
            'canManage' => request()->user()?->can('integrations.manage') ?? false,
        ]);
    }

    public function create(Request $request, IntegrationProviderRegistry $providerRegistry): Response
    {
        $providers = $providerRegistry->options();

        $clients = Client::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $initialProvider = $request->input('provider');
        if (!is_string($initialProvider) || !array_key_exists($initialProvider, $providers)) {
            $initialProvider = array_key_first($providers) ?: IntegrationConnection::PROVIDER_CUSTOM;
        }

        return Inertia::render('Integrations/Create', [
            'clients' => $clients,
            'providers' => $providers,
            'initialProvider' => $initialProvider,
        ]);
    }

    public function store(Request $request, IntegrationProviderRegistry $providerRegistry): RedirectResponse
    {
        $providerKeys = implode(',', array_keys($providerRegistry->options()));

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'provider' => ['required', "in:{$providerKeys}"],
            'client_id' => ['nullable', 'exists:clients,id'],
            'auth_type' => ['required', 'in:api_key,bearer,basic,custom'],
            'base_url' => ['nullable', 'url'],
            'credentials' => ['nullable', 'array'],
            'settings' => ['nullable', 'array'],
            'webhook_secret' => ['nullable', 'string', 'max:255'],
            'sync_frequency_minutes' => ['required', 'integer', 'min:5', 'max:1440'],
            'is_active' => ['boolean'],
        ]);

        $validated['created_by'] = $request->user()->id;
        $validated['is_active'] = (bool) ($validated['is_active'] ?? true);

        IntegrationConnection::create($validated);

        return redirect()->route('integrations.index')
            ->with('message', 'Integration connection created successfully.');
    }

    public function edit(
        Request $request,
        IntegrationConnection $integration,
        IntegrationProviderRegistry $providerRegistry
    ): Response
    {
        $integration->load([
            'clientMappings' => fn ($query) => $query
                ->with('client:id,name,code')
                ->orderBy('external_client_name'),
        ]);

        $clients = Client::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Integrations/Edit', [
            'integration' => $integration,
            'clients' => $clients,
            'providers' => $providerRegistry->options(),
            'discoveredClients' => $request->session()->get('integration_discovered_clients', []),
        ]);
    }

    public function update(
        Request $request,
        IntegrationConnection $integration,
        IntegrationProviderRegistry $providerRegistry
    ): RedirectResponse {
        $providerKeys = implode(',', array_keys($providerRegistry->options()));

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'provider' => ['required', "in:{$providerKeys}"],
            'client_id' => ['nullable', 'exists:clients,id'],
            'auth_type' => ['required', 'in:api_key,bearer,basic,custom'],
            'base_url' => ['nullable', 'url'],
            'credentials' => ['nullable', 'array'],
            'settings' => ['nullable', 'array'],
            'webhook_secret' => ['nullable', 'string', 'max:255'],
            'sync_frequency_minutes' => ['required', 'integer', 'min:5', 'max:1440'],
            'is_active' => ['boolean'],
        ]);

        $validated['is_active'] = (bool) ($validated['is_active'] ?? false);

        $integration->update($validated);

        return redirect()->route('integrations.index')
            ->with('message', 'Integration connection updated successfully.');
    }

    public function destroy(IntegrationConnection $integration): RedirectResponse
    {
        $integration->delete();

        return redirect()->route('integrations.index')
            ->with('message', 'Integration connection deleted successfully.');
    }

    public function storeMapping(Request $request, IntegrationConnection $integration): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'external_client_id' => ['required', 'string', 'max:255'],
            'external_client_name' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);

        IntegrationClientMapping::query()->updateOrCreate(
            [
                'integration_connection_id' => $integration->id,
                'external_client_id' => $validated['external_client_id'],
            ],
            [
                'client_id' => $validated['client_id'],
                'external_client_name' => $validated['external_client_name'] ?? null,
                'is_active' => (bool) ($validated['is_active'] ?? true),
            ],
        );

        return back()->with('message', 'Client mapping saved.');
    }

    public function destroyMapping(
        IntegrationConnection $integration,
        IntegrationClientMapping $mapping
    ): RedirectResponse {
        if ($mapping->integration_connection_id !== $integration->id) {
            abort(404);
        }

        $mapping->delete();

        return back()->with('message', 'Client mapping removed.');
    }

    public function sync(
        Request $request,
        IntegrationConnection $integration,
        IntegrationSyncService $syncService
    ): RedirectResponse {
        if ($request->boolean('queued')) {
            SyncIntegrationConnectionJob::dispatch($integration->id, $request->user()->id);

            return back()->with('message', "Sync queued for {$integration->name}.");
        }

        $run = $syncService->syncConnection($integration, $request->user());
        $message = $run->status === 'failed'
            ? "Sync failed: {$run->error_message}"
            : "Sync complete: {$run->items_processed} processed, {$run->items_created} created, {$run->items_updated} updated.";

        return back()->with('message', $message);
    }

    public function discoverClients(
        Request $request,
        IntegrationConnection $integration,
        IntegrationSyncService $syncService
    ): RedirectResponse {
        try {
            $discovered = $syncService->discoverExternalClients($integration);
            $autoMapped = 0;

            if ($request->boolean('auto_map')) {
                foreach ($discovered as $client) {
                    $name = trim((string) ($client['external_client_name'] ?? ''));
                    $externalClientId = (string) ($client['external_client_id'] ?? '');

                    if ($name === '' || $externalClientId === '') {
                        continue;
                    }

                    $localClient = Client::query()
                        ->whereRaw('LOWER(name) = ?', [strtolower($name)])
                        ->first();

                    if (!$localClient) {
                        continue;
                    }

                    IntegrationClientMapping::query()->updateOrCreate(
                        [
                            'integration_connection_id' => $integration->id,
                            'external_client_id' => $externalClientId,
                        ],
                        [
                            'client_id' => $localClient->id,
                            'external_client_name' => $name,
                            'is_active' => true,
                        ],
                    );

                    $autoMapped++;
                }
            }

            $message = 'Discovered '.count($discovered).' external clients.';
            if ($request->boolean('auto_map')) {
                $message .= " Auto-mapped {$autoMapped}.";
            }

            return back()
                ->with('message', $message)
                ->with('integration_discovered_clients', $discovered);
        } catch (\Throwable $exception) {
            return back()->withErrors([
                'integration' => "Discovery failed: {$exception->getMessage()}",
            ]);
        }
    }
}
