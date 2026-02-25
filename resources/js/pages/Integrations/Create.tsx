import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import type { BreadcrumbItem, Client } from '@/types';

type Props = {
    clients: Client[];
    providers: Record<string, string>;
    initialProvider?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Integrations', href: '/integrations' },
    { title: 'Create', href: '/integrations/create' },
];

export default function IntegrationsCreate({ clients, providers, initialProvider }: Props) {
    const providerKeys = useMemo(() => Object.keys(providers), [providers]);
    const defaultProvider = useMemo(() => {
        if (initialProvider && providerKeys.includes(initialProvider)) {
            return initialProvider;
        }

        return providerKeys[0] ?? 'custom';
    }, [initialProvider, providerKeys]);
    const defaultTemplate = useMemo(
        () => getProviderJsonTemplate(defaultProvider),
        [defaultProvider],
    );
    const [jsonError, setJsonError] = useState<string | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        provider: defaultProvider,
        client_id: '',
        auth_type: 'api_key',
        base_url: '',
        credentials: {} as Record<string, unknown>,
        settings: {} as Record<string, unknown>,
        webhook_secret: '',
        sync_frequency_minutes: 60,
        is_active: true,
    });

    const [credentialsText, setCredentialsText] = useState(defaultTemplate.credentials);
    const [settingsText, setSettingsText] = useState(defaultTemplate.settings);

    const applyProviderTemplate = (provider: string) => {
        const template = getProviderJsonTemplate(provider);
        setCredentialsText(template.credentials);
        setSettingsText(template.settings);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const credentials = JSON.parse(credentialsText || '{}');
            const settings = JSON.parse(settingsText || '{}');

            setData('credentials', credentials);
            setData('settings', settings);
            setJsonError(null);

            post('/integrations');
        } catch {
            setJsonError('Credentials and settings must be valid JSON.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Integration" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Link href="/integrations">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Create Integration</h1>
                        <p className="text-muted-foreground">
                            Configure a provider connection for asset and workflow sync.
                        </p>
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
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="ConnectWise Production"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label>Provider *</Label>
                                <Select
                                    value={data.provider}
                                    onValueChange={(value) => {
                                        setData('provider', value);
                                        applyProviderTemplate(value);
                                    }}
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
                                    onClick={() => applyProviderTemplate(data.provider)}
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
                                        <SelectValue placeholder="Global" />
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
                                    Optional but recommended. Used to validate provider webhooks.
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
                        webhookPath="/webhooks/integrations/{integration_id}"
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

                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Integration
                        </Button>
                        <Link href="/integrations">
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
