import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Archive,
    ArrowLeft,
    CheckCircle,
    Clock,
    Edit,
    FileText,
    ShieldOff,
    ThumbsUp,
    ThumbsDown,
    Users,
    Settings2,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, ChangeRequest, SharedData } from '@/types';

interface Approval {
    id: number;
    type: 'client' | 'cab';
    status: 'pending' | 'approved' | 'rejected';
    comments: string | null;
    responded_at: string | null;
    client_contact?: { name: string; email: string } | null;
    user?: { name: string } | null;
}

type ChangeWithRelations = ChangeRequest & {
    rejection_reason?: string | null;
    client?: { name: string; code: string } | null;
    requester?: { name: string } | null;
    approver?: { name: string } | null;
    approvals?: Approval[];
    form_schema?: {
        id: number;
        name: string;
        slug: string;
    } | null;
    external_assets?: Array<{
        id: number;
        name: string;
        provider: string;
        external_type: string;
        status?: string | null;
        pivot?: {
            relationship_type: string;
        };
    }>;
    runbook_steps?: Array<{
        id: number;
        step_order: number;
        title: string;
        status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    }>;
    post_implementation_review?: {
        outcome: string;
        summary?: string | null;
        reviewed_at?: string | null;
        reviewer?: { name: string } | null;
    } | null;
};

interface Props {
    change: ChangeWithRelations;
}

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

export default function ChangeShow({ change }: Props) {
    const { auth } = usePage<SharedData>().props;
    const { delete: destroy, post, processing } = useForm();
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showBypassDialog, setShowBypassDialog] = useState(false);
    const [bypassReason, setBypassReason] = useState('');

    const handleArchive = () => {
        if (confirm('Archive this change request? It will be removed from active lists but retained for audit history.')) {
            destroy(`/changes/${change.id}`);
        }
    };

    const handleSubmit = () => {
        if (confirm('Submit this change request for review?')) {
            post(`/changes/${change.id}/submit`);
        }
    };

    const handleApprove = () => {
        if (confirm('Approve this change request?')) {
            router.post(`/changes/${change.id}/transition`, { status: 'approved' });
        }
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) return;
        router.post(`/changes/${change.id}/transition`, {
            status: 'rejected',
            reason: rejectionReason,
        });
    };

    const handleRevise = () => {
        router.post(`/changes/${change.id}/transition`, {
            status: 'draft',
        }, {
            onSuccess: () => {
                router.visit(`/changes/${change.id}/edit`);
            },
        });
    };

    const handleBypassClientApproval = () => {
        if (!bypassReason.trim()) return;
        router.post(`/changes/${change.id}/bypass-client-approval`, {
            reason: bypassReason,
        }, {
            onSuccess: () => {
                setShowBypassDialog(false);
                setBypassReason('');
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Change Requests', href: '/changes' },
        { title: change.change_id, href: `/changes/${change.id}` },
    ];

    const hasEditPermission = auth.user?.permissions?.includes('changes.edit') ?? false;
    const canApprove = auth.user?.permissions?.includes('changes.approve') ?? false;
    const canEdit = hasEditPermission && (change.status === 'draft' || change.status === 'submitted');
    const canSubmit = hasEditPermission && change.status === 'draft';
    const pendingApproval = change.status === 'submitted' || change.status === 'pending_approval';
    const canArchive = auth.user?.permissions?.includes('changes.delete') ?? false;
    const isTerminal = change.status === 'completed' || change.status === 'cancelled';

    const pendingClientApprovals = (change.approvals ?? []).filter(
        (a) => a.type === 'client' && a.status === 'pending'
    );
    const hasPendingClientApprovals = pendingClientApprovals.length > 0;
    const bypassEmailList = pendingClientApprovals
        .map((a) => a.client_contact?.email)
        .filter(Boolean) as string[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={change.title} />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
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
                            <h1 className="text-3xl font-bold tracking-tight mt-1">{change.title}</h1>
                            <p className="text-muted-foreground">
                                {change.client?.name ?? '—'} • Requested by {change.requester?.name ?? '—'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {canSubmit && (
                            <Button onClick={handleSubmit} disabled={processing}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Submit for Approval
                            </Button>
                        )}
                        {canEdit && (
                            <Link href={`/changes/${change.id}/edit`}>
                                <Button variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                        <Link href={`/changes/${change.id}/operations`}>
                            <Button variant="outline">
                                <Settings2 className="mr-2 h-4 w-4" />
                                Operations
                            </Button>
                        </Link>
                        {canArchive && (
                            <Button variant="outline" onClick={handleArchive} disabled={processing}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                            </Button>
                        )}
                    </div>
                </div>

                {/* Approval Panel — visible to approvers when change is awaiting decision */}
                {canApprove && pendingApproval && (
                    <Card className="border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <AlertCircle className="h-5 w-5 text-blue-600" />
                                Awaiting Approval
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {!showRejectForm ? (
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={handleApprove}
                                    >
                                        <ThumbsUp className="h-4 w-4 mr-2" />
                                        Approve
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-red-300 text-red-700 hover:bg-red-50"
                                        onClick={() => setShowRejectForm(true)}
                                    >
                                        <ThumbsDown className="h-4 w-4 mr-2" />
                                        Reject
                                    </Button>
                                    {hasPendingClientApprovals && (
                                        <Button
                                            variant="outline"
                                            className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                            onClick={() => setShowBypassDialog(true)}
                                        >
                                            <ShieldOff className="h-4 w-4 mr-2" />
                                            Bypass Client Approval
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Textarea
                                        placeholder="Reason for rejection (required)"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={3}
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleReject}
                                            disabled={!rejectionReason.trim()}
                                        >
                                            Confirm Rejection
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Rejection Banner — visible when change was rejected, with reason and Revise button */}
                {change.status === 'rejected' && (
                    <Card className="border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base text-red-700">
                                <XCircle className="h-5 w-5" />
                                Change Request Rejected
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {change.rejection_reason && (
                                <div className="rounded-md border border-red-200 bg-white/60 p-3">
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Reason</p>
                                    <p className="text-sm">{change.rejection_reason}</p>
                                </div>
                            )}
                            {hasEditPermission && (
                                <div className="flex gap-2">
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={handleRevise}
                                        disabled={processing}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Revise & Resubmit
                                    </Button>
                                </div>
                            )}
                            {!hasEditPermission && (
                                <p className="text-sm text-muted-foreground">
                                    Contact a Change Manager to revise and resubmit this change request.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Standalone Bypass Button — visible when change is approved/scheduled but client approvals are still pending */}
                {canApprove && !pendingApproval && !isTerminal && change.status !== 'rejected' && hasPendingClientApprovals && (
                    <Card className="border-orange-200 bg-orange-50/40 dark:border-orange-900 dark:bg-orange-950/20">
                        <CardContent className="flex items-center justify-between py-4">
                            <p className="text-sm text-muted-foreground">
                                {pendingClientApprovals.length} client approval{pendingClientApprovals.length !== 1 ? 's' : ''} still pending
                            </p>
                            <Button
                                variant="outline"
                                className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                onClick={() => setShowBypassDialog(true)}
                            >
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Bypass Client Approval
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap">{change.description || 'No description provided.'}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Implementation Plan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap">{change.implementation_plan || 'No implementation plan provided.'}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Backout Plan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap">{change.backout_plan || 'No backout plan provided.'}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Test Plan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap">{change.test_plan || 'No test plan provided.'}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Business Justification</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap">{change.business_justification || 'No business justification provided.'}</p>
                            </CardContent>
                        </Card>

                        {change.form_schema && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Template Data</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        {change.form_schema.name}
                                    </p>
                                    {change.form_data && Object.keys(change.form_data).length > 0 ? (
                                        <div className="space-y-2">
                                            {Object.entries(change.form_data).map(([key, value]) => (
                                                <div key={key} className="rounded border p-3">
                                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                                        {key}
                                                    </p>
                                                    <p className="mt-1 break-words text-sm">
                                                        {Array.isArray(value)
                                                            ? value.join(', ')
                                                            : String(value ?? '')}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No template fields captured.</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Approvals Section */}
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
                                            const StatusIcon = approvalStatusIcons[approval.status];
                                            return (
                                                <div 
                                                    key={approval.id} 
                                                    className="flex items-start justify-between p-3 rounded-lg border"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <StatusIcon className={`h-5 w-5 mt-0.5 ${
                                                            approval.status === 'approved' ? 'text-green-600' :
                                                            approval.status === 'rejected' ? 'text-red-600' :
                                                            'text-yellow-600'
                                                        }`} />
                                                        <div>
                                                            <p className="font-medium">
                                                                {approval.type === 'client' 
                                                                    ? approval.client_contact?.name 
                                                                    : 'CAB Review'
                                                                }
                                                            </p>
                                                            <p className="text-sm text-muted-foreground capitalize">
                                                                {approval.type} • {approval.status}
                                                            </p>
                                                            {approval.comments && (
                                                                <p className="text-sm mt-1 italic">
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

                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Priority</p>
                                    <Badge variant="outline" className="capitalize">{change.priority}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Change Type</p>
                                    <p className="font-medium capitalize">{change.change_type || 'Not specified'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Risk Level</p>
                                    <p className="font-medium capitalize">{change.risk_level || 'Not specified'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Risk Score</p>
                                    <p className="font-medium">{change.risk_score ?? 'Not calculated'}</p>
                                </div>
                                {change.form_schema && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Form Template</p>
                                        <p className="font-medium">{change.form_schema.name}</p>
                                    </div>
                                )}
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">Requested Date</p>
                                    <p className="font-medium">
                                        {change.requested_date 
                                            ? new Date(change.requested_date).toLocaleString()
                                            : 'Not specified'
                                        }
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
                                            <p className="font-medium">{String(change.policy_decision.policy_name)}</p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {(change.runbook_steps ?? []).length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Runbook Progress</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {(() => {
                                        const steps = change.runbook_steps ?? [];
                                        const completed = steps.filter((s) => s.status === 'completed').length;
                                        const total = steps.length;
                                        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                                        return (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">{completed} of {total} steps complete</span>
                                                    <span className="font-medium">{pct}%</span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-500 transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <Link href={`/changes/${change.id}/operations`} className="w-full">
                                                    <Button variant="ghost" size="sm" className="w-full mt-1">
                                                        View Runbook
                                                    </Button>
                                                </Link>
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        )}

                        {change.post_implementation_review && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Post-Implementation Review</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge className={
                                            change.post_implementation_review.outcome === 'successful' ? 'bg-emerald-100 text-emerald-800' :
                                            change.post_implementation_review.outcome === 'partial_failure' ? 'bg-yellow-100 text-yellow-800' :
                                            change.post_implementation_review.outcome === 'rolled_back' ? 'bg-orange-100 text-orange-800' :
                                            'bg-red-100 text-red-800'
                                        }>
                                            {change.post_implementation_review.outcome.replaceAll('_', ' ')}
                                        </Badge>
                                    </div>
                                    {change.post_implementation_review.summary && (
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {change.post_implementation_review.summary}
                                        </p>
                                    )}
                                    {change.post_implementation_review.reviewed_at && (
                                        <p className="text-xs text-muted-foreground">
                                            Reviewed {new Date(change.post_implementation_review.reviewed_at).toLocaleDateString()}
                                            {change.post_implementation_review.reviewer?.name
                                                ? ` by ${change.post_implementation_review.reviewer.name}`
                                                : ''}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

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
                                <Link href="/export/changes" className="w-full">
                                    <Button variant="ghost" className="w-full justify-start">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Export List
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Bypass Client Approval Dialog */}
            <Dialog open={showBypassDialog} onOpenChange={(open) => {
                setShowBypassDialog(open);
                if (!open) setBypassReason('');
            }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldOff className="h-5 w-5 text-orange-600" />
                            Bypass Client Approval
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <p className="text-sm text-muted-foreground">
                            This will bypass all pending client approval requests and
                            mark them as approved on their behalf. The following client
                            contact{bypassEmailList.length !== 1 ? 's' : ''} will be
                            notified by email:
                        </p>

                        {bypassEmailList.length > 0 ? (
                            <ul className="rounded-md border bg-muted/40 px-4 py-2 space-y-1">
                                {bypassEmailList.map((email) => (
                                    <li key={email} className="text-sm font-medium">{email}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                No email addresses found for pending approvers.
                            </p>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">
                                Reason for bypass <span className="text-red-500">*</span>
                            </label>
                            <Textarea
                                placeholder="Provide a clear reason why client approval is being bypassed..."
                                value={bypassReason}
                                onChange={(e) => setBypassReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => { setShowBypassDialog(false); setBypassReason(''); }}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={handleBypassClientApproval}
                            disabled={bypassReason.trim().length < 10}
                        >
                            <ShieldOff className="h-4 w-4 mr-2" />
                            Bypass & Notify Client
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
