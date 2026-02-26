import { Head, Link, usePage } from '@inertiajs/react';
import {
    Archive,
    ArrowLeft,
    CheckCircle,
    Clock,
    Edit,
    FileText,
    Settings2,
    Users,
    XCircle,
} from 'lucide-react';
import { CollapsibleSection } from '@/components/changes/CollapsibleSection';
import { CommunicationsPanel } from '@/components/changes/CommunicationsPanel';
import { NextActionBanner } from '@/components/changes/NextActionBanner';
import { PirPanel } from '@/components/changes/PirPanel';
import { RunbookPanel } from '@/components/changes/RunbookPanel';
import { WorkflowEventStream } from '@/components/changes/WorkflowEventStream';
import { WorkflowStepper } from '@/components/changes/WorkflowStepper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type {
    BreadcrumbItem,
    CabVoteSummary,
    ChangeRequest,
    Engineer,
    SharedData,
    UserCabVote,
} from '@/types';

type ChangeWithRelations = ChangeRequest;

interface Props {
    change: ChangeWithRelations;
    engineers: Engineer[];
    voteSummary: CabVoteSummary | null;
    userVote: UserCabVote;
}

const CHANGE_TYPES: Record<string, string> = {
    standard: 'Standard',
    normal: 'Normal',
    emergency: 'Emergency',
    network: 'Network',
    server_cloud: 'Server / Cloud',
    identity_access: 'Identity & Access',
    security_patch: 'Security Patch',
};

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-800',
    submitted: 'bg-blue-100 text-blue-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    scheduled: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-orange-100 text-orange-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-slate-200 text-slate-600',
};

const approvalStatusIcons = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle,
};

export default function ChangeShow({ change, engineers, voteSummary, userVote }: Props) {
    const { auth, flash } = usePage<SharedData>().props;
    const hasEditPermission = auth.user?.permissions?.includes('changes.edit') ?? false;
    const canEdit = hasEditPermission && (change.status === 'draft' || change.status === 'submitted');
    const canArchive = auth.user?.permissions?.includes('changes.delete') ?? false;

    const showRunbook = ['approved', 'scheduled', 'in_progress', 'completed'].includes(change.status);
    const showPir = ['in_progress', 'completed'].includes(change.status);
    const showComms = ['approved', 'scheduled', 'in_progress', 'completed'].includes(change.status);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Change Requests', href: '/changes' },
        { title: change.change_id, href: `/changes/${change.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={change.title} />

            <div className="flex h-full flex-1 flex-col gap-4 p-6">
                {/* Flash messages */}
                {flash.message && (
                    <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/20 dark:text-green-400">
                        {flash.message}
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-start gap-4">
                        <Link href="/changes">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-sm font-mono text-muted-foreground">
                                    {change.change_id}
                                </span>
                                <Badge className={statusColors[change.status] || 'bg-slate-100'}>
                                    {change.status.replaceAll('_', ' ')}
                                </Badge>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight mt-1">{change.title}</h1>
                            <p className="text-muted-foreground">
                                {change.client?.name ?? '—'} • Requested by {change.requester?.name ?? '—'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {canEdit && (
                            <Link href={`/changes/${change.id}/edit`}>
                                <Button variant="outline" size="sm">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                        {canArchive && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (confirm('Archive this change request?')) {
                                        // Use Inertia delete
                                        import('@inertiajs/react').then(({ router }) => {
                                            router.delete(`/changes/${change.id}`);
                                        });
                                    }
                                }}
                            >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                            </Button>
                        )}
                    </div>
                </div>

                {/* Workflow Stepper */}
                <WorkflowStepper currentStatus={change.status} />

                {/* Next Action Banner — the primary interaction point */}
                <NextActionBanner
                    change={change}
                    engineers={engineers}
                    voteSummary={voteSummary}
                    userVote={userVote}
                />

                {/* Main content grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Column */}
                    <div className="space-y-4 lg:col-span-2">
                        {/* Runbook Steps */}
                        {showRunbook && <RunbookPanel change={change} />}

                        {/* Post-Implementation Review */}
                        {showPir && <PirPanel change={change} />}

                        {/* Communications */}
                        {showComms && <CommunicationsPanel change={change} />}

                        {/* Change Details (collapsible) */}
                        <CollapsibleSection title="Change Details" icon={FileText} defaultOpen={change.status === 'draft'}>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                                    <p className="mt-1 whitespace-pre-wrap text-sm">
                                        {change.description || 'No description provided.'}
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Implementation Plan</p>
                                    <p className="mt-1 whitespace-pre-wrap text-sm">
                                        {change.implementation_plan || 'No implementation plan provided.'}
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Backout Plan</p>
                                    <p className="mt-1 whitespace-pre-wrap text-sm">
                                        {change.backout_plan || 'No backout plan provided.'}
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Test Plan</p>
                                    <p className="mt-1 whitespace-pre-wrap text-sm">
                                        {change.test_plan || 'No test plan provided.'}
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Business Justification</p>
                                    <p className="mt-1 whitespace-pre-wrap text-sm">
                                        {change.business_justification || 'No business justification provided.'}
                                    </p>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Template Data */}
                        {change.form_schema && change.form_data && Object.keys(change.form_data).length > 0 && (
                            <CollapsibleSection title={`Template: ${change.form_schema.name}`} icon={FileText}>
                                <div className="space-y-2">
                                    {Object.entries(change.form_data).map(([key, value]) => (
                                        <div key={key} className="rounded border p-3">
                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">{key}</p>
                                            <p className="mt-1 break-words text-sm">
                                                {Array.isArray(value) ? value.join(', ') : String(value ?? '')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Approvals History */}
                        {change.approvals && change.approvals.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Approvals
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {change.approvals.map((approval) => {
                                            const StatusIcon =
                                                approvalStatusIcons[approval.status] ?? Clock;
                                            return (
                                                <div
                                                    key={approval.id}
                                                    className="flex items-start justify-between rounded-lg border p-3"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <StatusIcon
                                                            className={`mt-0.5 h-5 w-5 ${
                                                                approval.status === 'approved'
                                                                    ? 'text-green-600'
                                                                    : approval.status === 'rejected'
                                                                      ? 'text-red-600'
                                                                      : 'text-yellow-600'
                                                            }`}
                                                        />
                                                        <div>
                                                            <p className="font-medium">
                                                                {approval.type === 'client'
                                                                    ? approval.client_contact?.name
                                                                    : 'CAB Review'}
                                                            </p>
                                                            <p className="text-sm capitalize text-muted-foreground">
                                                                {approval.type} • {approval.status}
                                                            </p>
                                                            {approval.comments && (
                                                                <p className="mt-1 text-sm italic">
                                                                    &ldquo;{approval.comments}&rdquo;
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {approval.responded_at && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(approval.responded_at).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Workflow Event Stream */}
                        <WorkflowEventStream events={change.workflow_events ?? []} />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Priority</p>
                                    <Badge variant="outline" className="capitalize">
                                        {change.priority}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Change Type</p>
                                    <p className="font-medium">
                                        {(change.change_type && CHANGE_TYPES[change.change_type]) ||
                                            change.change_type?.replaceAll('_', ' ') ||
                                            'Not specified'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Risk Level</p>
                                    <p className="font-medium capitalize">
                                        {change.risk_level || 'Not specified'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Risk Score</p>
                                    <p className="font-medium">
                                        {change.risk_score ?? 'Not calculated'}
                                    </p>
                                </div>
                                {change.assigned_engineer && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Assigned Engineer</p>
                                        <p className="font-medium">{change.assigned_engineer.name}</p>
                                    </div>
                                )}
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">Requested Date</p>
                                    <p className="font-medium">
                                        {change.requested_date
                                            ? new Date(change.requested_date).toLocaleString()
                                            : 'Not specified'}
                                    </p>
                                </div>
                                {change.scheduled_start_date && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Scheduled</p>
                                        <p className="font-medium">
                                            {new Date(change.scheduled_start_date).toLocaleString()}
                                        </p>
                                        {change.scheduled_end_date && (
                                            <p className="text-sm text-muted-foreground">
                                                to {new Date(change.scheduled_end_date).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {change.approved_at && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Approved By</p>
                                            <p className="font-medium">{change.approver?.name ?? '—'}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(change.approved_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </>
                                )}
                                {change.policy_decision?.policy_name && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Matched Policy</p>
                                            <p className="font-medium">
                                                {String(change.policy_decision.policy_name)}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Impacted Assets</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {(change.external_assets ?? []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No linked assets.</p>
                                ) : (
                                    (change.external_assets ?? []).map((asset) => (
                                        <div key={asset.id} className="rounded border p-2">
                                            <p className="font-medium">{asset.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {asset.provider} • {asset.external_type}
                                                {asset.status ? ` • ${asset.status}` : ''}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Links</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href={`/changes/${change.id}/operations`} className="w-full">
                                    <Button variant="ghost" className="w-full justify-start">
                                        <Settings2 className="mr-2 h-4 w-4" />
                                        Operations Workspace
                                    </Button>
                                </Link>
                                <Link href={`/changes/${change.id}/print`} className="w-full">
                                    <Button variant="ghost" className="w-full justify-start">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Print Change
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
