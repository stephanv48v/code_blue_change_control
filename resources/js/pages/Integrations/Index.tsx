import { Head, Link, router, usePage } from '@inertiajs/react';
import { Cable, CheckCircle2, Plus, RefreshCw, Settings2, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, IntegrationConnection, SharedData } from '@/types';

type Props = {
    connections?: IntegrationConnection[];
    providers?: Record<string, string>;
    canManage?: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Integrations', href: '/integrations' },
];

export default function IntegrationsIndex({ connections, providers, canManage = false }: Props) {
    const { flash } = usePage<SharedData>().props;
    const safeConnections = connections ?? [];
    const safeProviders = providers ?? {};

    const handleSync = (id: number, queued = false) => {
        router.post(`/integrations/${id}/sync`, { queued }, { preserveScroll: true });
    };

    const handleDelete = (id: number, name: string) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        router.delete(`/integrations/${id}`, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Integrations" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage your PSA, RMM, and documentation tool connections.
                        </p>
                    </div>
                    {canManage && (
                        <div className="flex flex-wrap gap-2">
                            <Link href="/settings/integrations">
                                <Button variant="outline" size="sm">Setup guides</Button>
                            </Link>
                            <Link href="/integrations/create">
                                <Button size="sm">
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    Add connection
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Flash message */}
                {flash.message && (
                    <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>{flash.message}</AlertDescription>
                    </Alert>
                )}

                {/* Connections list */}
                {safeConnections.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <Cable className="h-8 w-8 text-muted-foreground" />
                            <div>
                                <p className="font-medium">No connections yet</p>
                                <p className="text-sm text-muted-foreground">
                                    Add your first integration to start importing assets.
                                </p>
                            </div>
                            {canManage && (
                                <Link href="/integrations/create">
                                    <Button size="sm">
                                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                                        Add connection
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {safeConnections.map((connection) => {
                            const lastRun = connection.sync_runs?.[0];
                            const providerLabel = safeProviders[connection.provider] ?? connection.provider;

                            return (
                                <Card key={connection.id}>
                                    <CardContent className="p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            {/* Left: name + meta */}
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium">{connection.name}</p>
                                                    <Badge variant={connection.is_active ? 'default' : 'secondary'}>
                                                        {connection.is_active ? 'Active' : 'Disabled'}
                                                    </Badge>
                                                    {lastRun && (
                                                        <Badge
                                                            variant={
                                                                lastRun.status === 'failed'
                                                                    ? 'destructive'
                                                                    : lastRun.status === 'success'
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {lastRun.status}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {providerLabel} &mdash; {connection.client?.name ?? 'Global'}
                                                </p>
                                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                    <span>
                                                        {connection.assets_count ?? 0} asset{connection.assets_count !== 1 ? 's' : ''}
                                                    </span>
                                                    <span>
                                                        {connection.client_mappings_count ?? 0} client mapping{connection.client_mappings_count !== 1 ? 's' : ''}
                                                    </span>
                                                    <span>
                                                        Last sync:{' '}
                                                        {connection.last_synced_at
                                                            ? new Date(connection.last_synced_at).toLocaleString()
                                                            : 'Never'}
                                                    </span>
                                                    <span>Every {connection.sync_frequency_minutes}m</span>
                                                </div>
                                                {lastRun?.error_message && (
                                                    <p className="mt-1 text-xs text-destructive">
                                                        {lastRun.error_message}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Right: actions */}
                                            {canManage && (
                                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleSync(connection.id)}
                                                        disabled={!connection.is_active}
                                                    >
                                                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                                        Sync now
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleSync(connection.id, true)}
                                                        disabled={!connection.is_active}
                                                    >
                                                        Queue sync
                                                    </Button>
                                                    <Link href={`/integrations/${connection.id}/edit`}>
                                                        <Button variant="secondary" size="sm">
                                                            <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                                                            Configure
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(connection.id, connection.name)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
