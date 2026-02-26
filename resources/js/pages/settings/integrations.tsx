import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Check, CheckCircle2, Copy, ExternalLink, Plus, RefreshCw, Settings2, Shield, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { getProviderSetupGuide } from '@/lib/integration-provider-meta';
import type { BreadcrumbItem, IntegrationConnection, SharedData } from '@/types';

type MicrosoftSsoStatus = {
    clientId: string;
    clientSecret: boolean;
    tenantId: string;
    configured: boolean;
    callbackUrl: string;
};

type GroupMapping = {
    id?: number;
    group_id: string;
    group_name: string;
    role_name: string;
};

type Props = {
    providers: Record<string, string>;
    connections: IntegrationConnection[];
    microsoftSso: MicrosoftSsoStatus;
    groupMappings: GroupMapping[];
    availableRoles: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/profile' },
    { title: 'Integrations', href: '/settings/integrations' },
];

export default function IntegrationSettings({ providers, connections, microsoftSso, groupMappings, availableRoles }: Props) {
    const safeProviders = providers ?? {};
    const safeConnections = connections ?? [];
    const providerEntries = Object.entries(safeProviders);

    const connectionsByProvider = safeConnections.reduce<Record<string, IntegrationConnection[]>>((acc, c) => {
        acc[c.provider] = [...(acc[c.provider] ?? []), c];
        return acc;
    }, {});

    const runSync = (id: number) => {
        router.post(`/integrations/${id}/sync`, { queued: false }, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Integration Settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Integration Connections"
                        description="Connect your MSP tools and keep asset/client data synchronised."
                    />

                    <MicrosoftSsoCard sso={microsoftSso} />

                    <GroupMappingsCard mappings={groupMappings} availableRoles={availableRoles} />

                    <Separator />

                    <Heading
                        variant="small"
                        title="MSP Tool Integrations"
                        description="Connect your PSA, RMM, and documentation tools."
                    />

                    {providerEntries.map(([provider, label]) => (
                        <ProviderCard
                            key={provider}
                            provider={provider}
                            label={label}
                            connections={connectionsByProvider[provider] ?? []}
                            onSync={runSync}
                        />
                    ))}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

// ---------------------------------------------------------------------------
// Provider card
// ---------------------------------------------------------------------------

type ProviderCardProps = {
    provider: string;
    label: string;
    connections: IntegrationConnection[];
    onSync: (id: number) => void;
};

function ProviderCard({ provider, label, connections, onSync }: ProviderCardProps) {
    const guide = getProviderSetupGuide(provider);
    const count = connections.length;

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                <div>
                    <CardTitle className="text-base">{label}</CardTitle>
                    <CardDescription>{guide.summary}</CardDescription>
                </div>
                <Badge variant={count > 0 ? 'default' : 'secondary'}>
                    {count} {count === 1 ? 'connection' : 'connections'}
                </Badge>
            </CardHeader>

            <CardContent className="space-y-5">
                {/* Required credentials */}
                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Required credentials
                    </p>
                    <ul className="space-y-1">
                        {guide.requiredCredentials.map((cred) => (
                            <li key={cred} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                                <code className="text-xs">{cred}</code>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Setup steps */}
                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Setup steps
                    </p>
                    <ol className="space-y-2">
                        {guide.setupSteps.map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                    {i + 1}
                                </span>
                                <span className="leading-snug text-muted-foreground">{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* Webhook info */}
                <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Webhook endpoint
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Point outbound webhooks to{' '}
                        <code className="rounded bg-muted px-1 text-xs">
                            /webhooks/integrations/&#123;integration_id&#125;
                        </code>{' '}
                        and send your secret as{' '}
                        <code className="rounded bg-muted px-1 text-xs">X-Integration-Token</code>.
                    </p>
                </div>

                {/* Existing connections for this provider */}
                {connections.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Connected
                            </p>
                            {connections.map((c) => (
                                <div
                                    key={c.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{c.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {c.client?.name ?? 'Global'} &mdash; last sync:{' '}
                                            {c.last_synced_at
                                                ? new Date(c.last_synced_at).toLocaleString()
                                                : 'Never'}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant={c.is_active ? 'default' : 'secondary'}>
                                            {c.is_active ? 'Active' : 'Disabled'}
                                        </Badge>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onSync(c.id)}
                                            disabled={!c.is_active}
                                        >
                                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                            Sync now
                                        </Button>
                                        <Link href={`/integrations/${c.id}/edit`}>
                                            <Button type="button" variant="secondary" size="sm">
                                                <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                                                Configure
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                    <Link href={`/integrations/create?provider=${provider}`}>
                        <Button size="sm">
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            Add {label} connection
                        </Button>
                    </Link>
                    {connections.length > 0 && (
                        <Link href="/integrations">
                            <Button size="sm" variant="outline">
                                Open manager
                            </Button>
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Microsoft SSO card
// ---------------------------------------------------------------------------

function MicrosoftSsoCard({ sso }: { sso: MicrosoftSsoStatus }) {
    const { flash } = usePage<SharedData>().props;
    const [copied, setCopied] = useState(false);

    const form = useForm({
        client_id: sso.clientId,
        tenant_id: sso.tenantId,
        client_secret: '',
    });

    const copyCallback = () => {
        navigator.clipboard.writeText(sso.callbackUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/settings/integrations/microsoft-sso', { preserveScroll: true });
    };

    return (
        <div className="space-y-4">
            <Heading
                variant="small"
                title="Microsoft Entra ID SSO"
                description="Single sign-on for staff using your organisation's Microsoft 365 accounts."
            />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <svg className="h-4 w-4" viewBox="0 0 21 21" aria-hidden="true">
                                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                            </svg>
                            Microsoft Sign-In
                        </CardTitle>
                        <CardDescription>Azure AD / Microsoft Entra ID app registration</CardDescription>
                    </div>
                    <Badge variant={sso.configured ? 'default' : 'secondary'}>
                        {sso.configured ? 'Configured' : 'Not configured'}
                    </Badge>
                </CardHeader>

                <CardContent className="space-y-5">
                    {flash.message && (
                        <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>{flash.message}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="ms-client-id">Application (Client) ID</Label>
                                <Input
                                    id="ms-client-id"
                                    value={form.data.client_id}
                                    onChange={(e) => form.setData('client_id', e.target.value)}
                                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                    autoComplete="off"
                                />
                                <InputError message={form.errors.client_id} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="ms-tenant-id">Directory (Tenant) ID</Label>
                                <Input
                                    id="ms-tenant-id"
                                    value={form.data.tenant_id}
                                    onChange={(e) => form.setData('tenant_id', e.target.value)}
                                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                    autoComplete="off"
                                />
                                <InputError message={form.errors.tenant_id} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="ms-client-secret">Client Secret</Label>
                                <Input
                                    id="ms-client-secret"
                                    type="password"
                                    value={form.data.client_secret}
                                    onChange={(e) => form.setData('client_secret', e.target.value)}
                                    placeholder={
                                        sso.clientSecret
                                            ? '••••••••  (leave blank to keep existing)'
                                            : 'Paste your client secret value'
                                    }
                                    autoComplete="new-password"
                                />
                                <InputError message={form.errors.client_secret} />
                            </div>
                        </div>

                        <Button type="submit" disabled={form.processing} size="sm">
                            Save credentials
                        </Button>
                    </form>

                    <Separator />

                    <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Callback URL — register this in your Azure app
                        </p>
                        <div className="flex items-center gap-2 rounded border bg-muted/40 px-3 py-2">
                            <code className="flex-1 break-all text-xs">{sso.callbackUrl}</code>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 shrink-0 px-2"
                                onClick={copyCallback}
                            >
                                {copied ? (
                                    <Check className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Setup steps
                        </p>
                        <ol className="space-y-2">
                            {[
                                { text: 'Sign in to ', link: { label: 'portal.azure.com', href: 'https://portal.azure.com' }, after: ' and go to Azure Active Directory → App registrations → New registration.' },
                                { text: 'Give the app a name, leave the default account type, then under Redirect URI choose Web and paste the Callback URL above.' },
                                { text: 'Copy the Application (client) ID and Directory (tenant) ID from the overview page into the fields above.' },
                                { text: 'Go to Certificates & secrets → New client secret, set an expiry, then paste the Value (not the ID) into the Client Secret field above.' },
                                { text: 'Under API permissions, confirm Microsoft Graph → User.Read is present (it is by default). Grant admin consent if required.' },
                                { text: 'Click Save credentials. New staff who sign in via Microsoft will be auto-created with the Engineer role unless their email is in ADMIN_EMAILS.' },
                            ].map((step, i) => (
                                <li key={i} className="flex gap-3 text-sm">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                        {i + 1}
                                    </span>
                                    <span className="leading-snug text-muted-foreground">
                                        {step.text}
                                        {step.link && (
                                            <a
                                                href={step.link.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-foreground underline hover:text-primary"
                                            >
                                                {step.link.label}
                                            </a>
                                        )}
                                        {step.after}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" size="sm">
                                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                Open Azure App Registrations
                            </Button>
                        </a>
                        {sso.configured && (
                            <a href="/auth/microsoft" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                    Test Sign-In
                                </Button>
                            </a>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Entra group → role mappings card
// ---------------------------------------------------------------------------

function GroupMappingsCard({ mappings: initialMappings, availableRoles }: { mappings: GroupMapping[]; availableRoles: string[] }) {
    const { flash } = usePage<SharedData>().props;

    const [rows, setRows] = useState<GroupMapping[]>(initialMappings);

    const addRow = () => {
        setRows((prev) => [...prev, { group_id: '', group_name: '', role_name: availableRoles[0] ?? '' }]);
    };

    const removeRow = (index: number) => {
        setRows((prev) => prev.filter((_, i) => i !== index));
    };

    const updateRow = (index: number, field: keyof GroupMapping, value: string) => {
        setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/settings/integrations/group-mappings', { mappings: rows }, { preserveScroll: true });
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4" />
                    Entra Group → Role Mappings
                </CardTitle>
                <CardDescription>
                    Automatically assign roles to staff based on their Azure AD / Entra ID security group memberships.
                    Roles are synced on every Microsoft sign-in.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {flash.message && (
                    <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>{flash.message}</AlertDescription>
                    </Alert>
                )}

                <Alert>
                    <AlertDescription className="text-xs">
                        <strong>Azure permission required:</strong> Your app registration needs{' '}
                        <code className="rounded bg-muted px-1 text-xs">GroupMember.Read.All</code> (Microsoft Graph,
                        delegated) with admin consent. Add it under{' '}
                        <em>API permissions → Add a permission → Microsoft Graph → Delegated → GroupMember.Read.All</em>.
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSave} className="space-y-3">
                    {rows.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No mappings configured. Click "Add mapping" to map an Entra group to a role.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            <div className="grid grid-cols-[1fr_1fr_160px_36px] gap-2 px-1">
                                <p className="text-xs font-medium text-muted-foreground">Group Object ID</p>
                                <p className="text-xs font-medium text-muted-foreground">Display name (optional)</p>
                                <p className="text-xs font-medium text-muted-foreground">Role</p>
                                <span />
                            </div>

                            {rows.map((row, index) => (
                                <div key={index} className="grid grid-cols-[1fr_1fr_160px_36px] items-center gap-2">
                                    <Input
                                        value={row.group_id}
                                        onChange={(e) => updateRow(index, 'group_id', e.target.value)}
                                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                        className="font-mono text-xs"
                                    />
                                    <Input
                                        value={row.group_name}
                                        onChange={(e) => updateRow(index, 'group_name', e.target.value)}
                                        placeholder="e.g. MSP Engineers"
                                    />
                                    <Select
                                        value={row.role_name}
                                        onValueChange={(value) => updateRow(index, 'role_name', value)}
                                    >
                                        <SelectTrigger className="text-sm">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableRoles.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {role}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        onClick={() => removeRow(index)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                        <Button type="button" variant="outline" size="sm" onClick={addRow}>
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            Add mapping
                        </Button>
                        <Button type="submit" size="sm">
                            Save mappings
                        </Button>
                    </div>
                </form>

                <div className="space-y-1 pt-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        How to find a group's Object ID
                    </p>
                    <ol className="space-y-1">
                        {[
                            'In the Azure portal, go to Azure Active Directory → Groups.',
                            'Click the group you want to map.',
                            'Copy the Object ID from the Overview page and paste it into the Group Object ID field above.',
                        ].map((text, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                    {i + 1}
                                </span>
                                <span className="leading-snug text-muted-foreground">{text}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            </CardContent>
        </Card>
    );
}
