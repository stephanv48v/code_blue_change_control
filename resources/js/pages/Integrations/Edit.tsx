import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ProviderSetupGuide from '@/components/integrations/provider-setup-guide';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getProviderJsonTemplate } from '@/lib/integration-provider-meta';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, Client, DiscoveredExternalClient, IntegrationConnection } from '@/types';

type Props = {
    integration: IntegrationConnection;
    clients: Client[];
    providers: Record<string, string>;
    discoveredClients?: DiscoveredExternalClient[];
};

export default function IntegrationsEdit({
    integration,
    clients,
    providers,
    discoveredClients = [],
}: Props) {
    const [jsonError, setJsonError] = useState<string | null>(null);

    const { data, setData, put, processing, errors } = useForm({
        name: integration.name,
        provider: integration.provider,
        client_id: integration.client_id ? String(integration.client_id) : '',
        auth_type: integration.auth_type,
        base_url: integration.base_url ?? '',
        credentials: integration.credentials ?? {},
        settings: integration.settings ?? {},
        webhook_secret: integration.webhook_secret ?? '',
        sync_frequency_minutes: integration.sync_frequency_minutes,
        is_active: integration.is_active,
    });

    const [credentialsText, setCredentialsText] = useState(
        JSON.stringify(integration.credentials ?? {}, null, 2),
    );
    const [settingsText, setSettingsText] = useState(
        JSON.stringify(integration.settings ?? {}, null, 2),
    );
    const [discoveredSelection, setDiscoveredSelection] = useState<string>('');

    const applyProviderTemplate = () => {
        const template = getProviderJsonTemplate(data.provider);
        setCredentialsText(template.credentials);
        setSettingsText(template.settings);
    };

    const mappingForm = useForm({
        client_id: '',
        external_client_id: '',
        external_client_name: '',
        is_active: true,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Integrations', href: '/integrations' },
        { title: integration.name, href: `/integrations/${integration.id}/edit` },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const credentials = JSON.parse(credentialsText || '{}');
            const settings = JSON.parse(settingsText || '{}');
            setData('credentials', credentials);
            setData('settings', settings);
            setJsonError(null);

            put(`/integrations/${integration.id}`);
        } catch {
            setJsonError('Credentials and settings must be valid JSON.');
        }
    };

    const submitMapping = (e: React.FormEvent) => {
        e.preventDefault();
        mappingForm.post(`/integrations/${integration.id}/mappings`, {
            preserveScroll: true,
            onSuccess: () => {
                mappingForm.reset('client_id', 'external_client_id', 'external_client_name');
            },
        });
    };

    const deleteMapping = (mappingId: number) => {
        if (!confirm('Delete this external client mapping?')) {
            return;
        }

        router.delete(`/integrations/${integration.id}/mappings/${mappingId}`, {
            preserveScroll: true,
        });
    };

    const runDiscovery = (autoMap = false) => {
        router.post(
            `/integrations/${integration.id}/discover-clients`,
            { auto_map: autoMap },
            { preserveScroll: true },
        );
    };

    const applyDiscoveredClient = (externalClientId: string) => {
        const selected = discoveredClients.find((client) => client.external_client_id === externalClientId);
        if (!selected) {
            return;
        }

        mappingForm.setData('external_client_id', selected.external_client_id);
        mappingForm.setData('external_client_name', selected.external_client_name || '');
        setDiscoveredSelection(externalClientId);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${integration.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Link href="/integrations">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Integration</h1>
                        <p className="text-muted-foreground">{integration.name}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Connection Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Name *</Label>
                                <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label>Provider *</Label>
                                <Select
                                    value={data.provider}
                                    onValueChange={(value) => setData('provider', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(providers).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.provider} />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={applyProviderTemplate}
                                    className="mt-1"
                                >
                                    Load Recommended JSON Template
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label>Client Scope</Label>
                                <Select
                                    value={data.client_id || 'global'}
                                    onValueChange={(value) => setData('client_id', value === 'global' ? '' : value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="global">Global (all clients)</SelectItem>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={String(client.id)}>
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.client_id} />
                            </div>

                            <div className="space-y-2">
                                <Label>Auth Type *</Label>
                                <Select
                                    value={data.auth_type}
                                    onValueChange={(value) => setData('auth_type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="api_key">API Key</SelectItem>
                                        <SelectItem value="bearer">Bearer Token</SelectItem>
                                        <SelectItem value="basic">Basic Auth</SelectItem>
                                        <SelectItem value="custom">Custom Headers</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.auth_type} />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Base URL</Label>
                                <Input
                                    value={data.base_url}
                                    onChange={(e) => setData('base_url', e.target.value)}
                                    placeholder="https://api.example.com"
                                />
                                <InputError message={errors.base_url} />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Webhook Secret</Label>
                                <Input
                                    value={data.webhook_secret}
                                    onChange={(e) => setData('webhook_secret', e.target.value)}
                                    placeholder="Shared secret for webhook endpoint auth"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Webhook URL: <code>{`/webhooks/integrations/${integration.id}`}</code>
                                </p>
                                <InputError message={errors.webhook_secret} />
                            </div>

                            <div className="space-y-2">
                                <Label>Sync Frequency (minutes)</Label>
                                <Input
                                    type="number"
                                    min={5}
                                    max={1440}
                                    value={data.sync_frequency_minutes}
                                    onChange={(e) => setData('sync_frequency_minutes', Number(e.target.value))}
                                />
                                <InputError message={errors.sync_frequency_minutes} />
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={data.is_active ? 'active' : 'disabled'}
                                    onValueChange={(value) => setData('is_active', value === 'active')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="disabled">Disabled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <ProviderSetupGuide
                        provider={data.provider}
                        providerLabel={providers[data.provider]}
                        webhookPath={`/webhooks/integrations/${integration.id}`}
                    />

                    <Card>
                        <CardHeader>
                            <CardTitle>Credentials JSON</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Textarea
                                rows={8}
                                value={credentialsText}
                                onChange={(e) => setCredentialsText(e.target.value)}
                            />
                            <InputError message={errors.credentials} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Provider Settings JSON</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Textarea
                                rows={8}
                                value={settingsText}
                                onChange={(e) => setSettingsText(e.target.value)}
                            />
                            <InputError message={errors.settings} />
                            {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>External Client Mappings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => runDiscovery(false)}
                                >
                                    Discover External Clients
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => runDiscovery(true)}
                                >
                                    Discover + Auto-Map by Name
                                </Button>
                            </div>

                            {discoveredClients.length > 0 && (
                                <div className="space-y-2 rounded border p-3">
                                    <p className="text-sm font-medium">Discovered External Clients</p>
                                    <div className="max-h-56 space-y-2 overflow-y-auto">
                                        {discoveredClients.map((client) => (
                                            <div
                                                key={client.external_client_id}
                                                className="flex items-center justify-between rounded border p-2"
                                            >
                                                <div>
                                                    <p className="font-medium">
                                                        {client.external_client_name || client.external_client_id}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {client.external_client_id}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant={
                                                        discoveredSelection === client.external_client_id
                                                            ? 'secondary'
                                                            : 'outline'
                                                    }
                                                    onClick={() => applyDiscoveredClient(client.external_client_id)}
                                                >
                                                    Use for Mapping
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={submitMapping} className="grid gap-3 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>External Client ID *</Label>
                                    <Input
                                        value={mappingForm.data.external_client_id}
                                        onChange={(e) =>
                                            mappingForm.setData('external_client_id', e.target.value)
                                        }
                                        placeholder="org-123 / tenant-id"
                                    />
                                    <InputError message={mappingForm.errors.external_client_id} />
                                </div>
                                <div className="space-y-2">
                                    <Label>External Client Name</Label>
                                    <Input
                                        value={mappingForm.data.external_client_name}
                                        onChange={(e) =>
                                            mappingForm.setData('external_client_name', e.target.value)
                                        }
                                        placeholder="Contoso Ltd"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Local Client *</Label>
                                    <Select
                                        value={mappingForm.data.client_id || undefined}
                                        onValueChange={(value) => mappingForm.setData('client_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select local client" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map((client) => (
                                                <SelectItem key={client.id} value={String(client.id)}>
                                                    {client.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={mappingForm.errors.client_id} />
                                </div>
                                <div className="md:col-span-3">
                                    <Button type="submit" variant="outline" disabled={mappingForm.processing}>
                                        Save Mapping
                                    </Button>
                                </div>
                            </form>

                            <div className="space-y-2">
                                {(integration.client_mappings ?? []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No mappings configured. Assets will default to connection client scope.
                                    </p>
                                ) : (
                                    (integration.client_mappings ?? []).map((mapping) => (
                                        <div key={mapping.id} className="flex items-center justify-between rounded border p-3">
                                            <div>
                                                <p className="font-medium">
                                                    {mapping.external_client_name || mapping.external_client_id}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {mapping.external_client_id} {'->'} {mapping.client?.name || 'Unknown'}
                                                </p>
                                            </div>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => deleteMapping(mapping.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                        <Link href="/integrations">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
