import { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Ban,
    CheckCircle,
    Clock,
    Edit,
    Play,
    ShieldOff,
    ThumbsDown,
    ThumbsUp,
    Vote,
    XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CabConditionsBanner } from './CabConditionsBanner';
import { CabVotePanel } from './CabVotePanel';
import { ScheduleAssignPanel } from './ScheduleAssignPanel';
import type { CabVoteSummary, ChangeRequest, Engineer, SharedData, UserCabVote } from '@/types';

interface NextActionBannerProps {
    change: ChangeRequest;
    engineers: Engineer[];
    voteSummary: CabVoteSummary | null;
    userVote: UserCabVote;
}

export function NextActionBanner({ change, engineers, voteSummary, userVote }: NextActionBannerProps) {
    const { auth } = usePage<SharedData>().props;
    const hasEditPermission = auth.user?.permissions?.includes('changes.edit') ?? false;
    const canApprove = auth.user?.permissions?.includes('changes.approve') ?? false;
    const isCabMember = auth.user?.roles?.includes('CAB Member') ?? false;
    const isRequester = auth.user?.id === change.requester_id;

    const { post, processing } = useForm();
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showBypassDialog, setShowBypassDialog] = useState(false);
    const [bypassReason, setBypassReason] = useState('');

    const pendingClientApprovals = (change.approvals ?? []).filter(
        (a) => a.type === 'client' && a.status === 'pending',
    );
    const hasPendingClientApprovals = pendingClientApprovals.length > 0;
    const bypassEmailList = pendingClientApprovals
        .map((a) => a.client_contact?.email)
        .filter(Boolean) as string[];

    // ─── DRAFT ───
    if (change.status === 'draft') {
        return (
            <ActionCard
                icon={CheckCircle}
                title="Ready to Submit"
                colour="blue"
                description="Review the details below, then submit this change for approval."
            >
                <Button
                    onClick={() => {
                        if (confirm('Submit this change request for review?')) {
                            post(`/changes/${change.id}/submit`);
                        }
                    }}
                    disabled={!hasEditPermission || processing}
                >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submit for Approval
                </Button>
            </ActionCard>
        );
    }

    // ─── SUBMITTED (awaiting client approval) ───
    if (change.status === 'submitted') {
        return (
            <ActionCard
                icon={Clock}
                title="Awaiting Client Approval"
                colour="yellow"
                description={
                    hasPendingClientApprovals
                        ? `${pendingClientApprovals.length} client approval${pendingClientApprovals.length !== 1 ? 's' : ''} pending.`
                        : 'Submitted and awaiting review.'
                }
            >
                {canApprove && !showRejectForm && (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            className="bg-green-600 text-white hover:bg-green-700"
                            onClick={() => {
                                if (confirm('Approve this change request?')) {
                                    router.post(`/changes/${change.id}/transition`, { status: 'approved' });
                                }
                            }}
                        >
                            <ThumbsUp className="mr-1.5 h-4 w-4" />
                            Approve
                        </Button>
                        <Button
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                            onClick={() => setShowRejectForm(true)}
                        >
                            <ThumbsDown className="mr-1.5 h-4 w-4" />
                            Reject
                        </Button>
                        {hasPendingClientApprovals && (
                            <Button
                                variant="outline"
                                className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                onClick={() => setShowBypassDialog(true)}
                            >
                                <ShieldOff className="mr-1.5 h-4 w-4" />
                                Bypass Client Approval
                            </Button>
                        )}
                    </div>
                )}
                {canApprove && showRejectForm && (
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
                                onClick={() => {
                                    if (rejectionReason.trim()) {
                                        router.post(`/changes/${change.id}/transition`, {
                                            status: 'rejected',
                                            reason: rejectionReason,
                                        });
                                    }
                                }}
                                disabled={!rejectionReason.trim()}
                            >
                                Confirm Rejection
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowRejectForm(false);
                                    setRejectionReason('');
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
                <BypassDialog
                    open={showBypassDialog}
                    onOpenChange={setShowBypassDialog}
                    changeId={change.id}
                    bypassReason={bypassReason}
                    setBypassReason={setBypassReason}
                    emailList={bypassEmailList}
                />
            </ActionCard>
        );
    }

    // ─── PENDING_APPROVAL (CAB voting) ───
    if (change.status === 'pending_approval') {
        return (
            <ActionCard
                icon={Vote}
                title="CAB Approval Required"
                colour="purple"
                description={
                    isCabMember
                        ? 'Cast your vote below to approve or reject this change.'
                        : 'Waiting for the Change Advisory Board to vote.'
                }
            >
                {isCabMember && voteSummary ? (
                    <CabVotePanel
                        changeId={change.id}
                        voteSummary={voteSummary}
                        userVote={userVote}
                    />
                ) : voteSummary ? (
                    <div className="flex gap-4 text-sm">
                        <span>
                            <strong>{voteSummary.approves}</strong> approve
                        </span>
                        <span>
                            <strong>{voteSummary.rejects}</strong> reject
                        </span>
                        <span>
                            <strong>{voteSummary.abstains}</strong> abstain
                        </span>
                        <Badge variant={voteSummary.quorum_met ? 'default' : 'secondary'}>
                            {voteSummary.quorum_met ? 'Quorum Met' : 'Quorum Pending'}
                        </Badge>
                    </div>
                ) : null}
                {canApprove && !isCabMember && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                        <Button
                            className="bg-green-600 text-white hover:bg-green-700"
                            size="sm"
                            onClick={() => {
                                if (confirm('Force-approve this change request?')) {
                                    router.post(`/changes/${change.id}/transition`, { status: 'approved' });
                                }
                            }}
                        >
                            <ThumbsUp className="mr-1.5 h-4 w-4" />
                            Force Approve
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                            onClick={() => setShowRejectForm(true)}
                        >
                            <ThumbsDown className="mr-1.5 h-4 w-4" />
                            Reject
                        </Button>
                    </div>
                )}
                {canApprove && !isCabMember && showRejectForm && (
                    <div className="mt-3 space-y-3 border-t pt-3">
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
                                onClick={() => {
                                    if (rejectionReason.trim()) {
                                        router.post(`/changes/${change.id}/transition`, {
                                            status: 'rejected',
                                            reason: rejectionReason,
                                        });
                                    }
                                }}
                                disabled={!rejectionReason.trim()}
                            >
                                Confirm Rejection
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </ActionCard>
        );
    }

    // ─── APPROVED ───
    if (change.status === 'approved') {
        const hasConditionsPending =
            change.cab_conditions && change.cab_conditions_status === 'pending';

        return (
            <ActionCard
                icon={CheckCircle}
                title="Approved — Schedule Implementation"
                colour="green"
                description={
                    hasConditionsPending
                        ? 'CAB conditions must be acknowledged before scheduling.'
                        : 'Set the implementation window and assign an engineer.'
                }
            >
                {hasConditionsPending && (
                    <CabConditionsBanner change={change} isRequester={isRequester} />
                )}
                {!hasConditionsPending && (
                    <ScheduleAssignPanel change={change} engineers={engineers} />
                )}
            </ActionCard>
        );
    }

    // ─── SCHEDULED ───
    if (change.status === 'scheduled') {
        return (
            <ActionCard
                icon={Play}
                title="Scheduled — Ready to Start"
                colour="indigo"
                description={
                    change.scheduled_start_date
                        ? `Window: ${new Date(change.scheduled_start_date).toLocaleString()}${change.scheduled_end_date ? ` — ${new Date(change.scheduled_end_date).toLocaleString()}` : ''}`
                        : 'Change is scheduled. Click Start to begin implementation.'
                }
            >
                <div className="flex flex-wrap gap-2">
                    <Button
                        size="lg"
                        disabled={!hasEditPermission}
                        onClick={() =>
                            router.post(`/changes/${change.id}/transition`, {
                                status: 'in_progress',
                                reason: '',
                            })
                        }
                    >
                        <Play className="mr-2 h-4 w-4" />
                        Start Change
                    </Button>
                </div>
                <div className="mt-3 border-t pt-3">
                    <ScheduleAssignPanel change={change} engineers={engineers} />
                </div>
            </ActionCard>
        );
    }

    // ─── IN_PROGRESS ───
    if (change.status === 'in_progress') {
        const steps = change.runbook_steps ?? [];
        const completed = steps.filter((s) => s.status === 'completed' || s.status === 'skipped').length;
        const total = steps.length;

        return (
            <ActionCard
                icon={AlertCircle}
                title="In Progress — Execute Runbook"
                colour="orange"
                description={
                    total > 0
                        ? `${completed}/${total} runbook steps completed. Complete all steps, then finish the change.`
                        : 'Change is in progress. Complete the implementation, then mark as done.'
                }
            >
                <Button
                    size="lg"
                    disabled={!hasEditPermission}
                    onClick={() => {
                        if (confirm('Mark this change as completed?')) {
                            router.post(`/changes/${change.id}/transition`, {
                                status: 'completed',
                                reason: '',
                            });
                        }
                    }}
                >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Change
                </Button>
            </ActionCard>
        );
    }

    // ─── COMPLETED ───
    if (change.status === 'completed') {
        const hasPir = !!change.post_implementation_review;

        return (
            <ActionCard
                icon={CheckCircle}
                title="Change Completed"
                colour="emerald"
                description={
                    hasPir
                        ? 'Implementation complete with post-implementation review recorded.'
                        : 'Implementation complete. Please fill in the post-implementation review below.'
                }
            >
                {!hasPir && (
                    <p className="text-sm text-muted-foreground">
                        Scroll down to complete the Post-Implementation Review.
                    </p>
                )}
            </ActionCard>
        );
    }

    // ─── REJECTED ───
    if (change.status === 'rejected') {
        return (
            <ActionCard icon={XCircle} title="Change Rejected" colour="red">
                {change.rejection_reason && (
                    <div className="rounded-md border border-red-200 bg-white/60 p-3 dark:bg-white/5">
                        <p className="text-sm font-medium text-muted-foreground">Reason</p>
                        <p className="mt-1 text-sm">{change.rejection_reason}</p>
                    </div>
                )}
                {hasEditPermission && (
                    <Button
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => {
                            router.post(
                                `/changes/${change.id}/transition`,
                                { status: 'draft' },
                                {
                                    onSuccess: () => {
                                        router.visit(`/changes/${change.id}/edit`);
                                    },
                                },
                            );
                        }}
                        disabled={processing}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Revise & Resubmit
                    </Button>
                )}
            </ActionCard>
        );
    }

    // ─── CANCELLED ───
    if (change.status === 'cancelled') {
        return (
            <ActionCard icon={Ban} title="Change Cancelled" colour="slate">
                <p className="text-sm text-muted-foreground">
                    This change request has been cancelled and cannot be modified.
                </p>
            </ActionCard>
        );
    }

    return null;
}

// ─── Helper components ───

const COLOUR_MAP: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20',
    green: 'border-green-200 bg-green-50/40 dark:border-green-900 dark:bg-green-950/20',
    yellow: 'border-yellow-200 bg-yellow-50/40 dark:border-yellow-900 dark:bg-yellow-950/20',
    red: 'border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/20',
    orange: 'border-orange-200 bg-orange-50/40 dark:border-orange-900 dark:bg-orange-950/20',
    purple: 'border-purple-200 bg-purple-50/40 dark:border-purple-900 dark:bg-purple-950/20',
    indigo: 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-900 dark:bg-indigo-950/20',
    emerald: 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20',
    slate: 'border-slate-200 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-900/20',
};

function ActionCard({
    icon: Icon,
    title,
    description,
    colour = 'blue',
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description?: string;
    colour?: string;
    children?: React.ReactNode;
}) {
    return (
        <Card className={COLOUR_MAP[colour] ?? COLOUR_MAP.blue}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5" />
                    {title}
                </CardTitle>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </CardHeader>
            {children && <CardContent className="space-y-3">{children}</CardContent>}
        </Card>
    );
}

function BypassDialog({
    open,
    onOpenChange,
    changeId,
    bypassReason,
    setBypassReason,
    emailList,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    changeId: number;
    bypassReason: string;
    setBypassReason: (v: string) => void;
    emailList: string[];
}) {
    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) setBypassReason('');
            }}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldOff className="h-5 w-5 text-orange-600" />
                        Bypass Client Approval
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <p className="text-sm text-muted-foreground">
                        This will bypass all pending client approval requests. The following client
                        contact{emailList.length !== 1 ? 's' : ''} will be notified:
                    </p>
                    {emailList.length > 0 && (
                        <ul className="space-y-1 rounded-md border bg-muted/40 px-4 py-2">
                            {emailList.map((email) => (
                                <li key={email} className="text-sm font-medium">
                                    {email}
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">
                            Reason for bypass <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                            placeholder="Provide a clear reason..."
                            value={bypassReason}
                            onChange={(e) => setBypassReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            onOpenChange(false);
                            setBypassReason('');
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="bg-orange-600 text-white hover:bg-orange-700"
                        onClick={() => {
                            router.post(
                                `/changes/${changeId}/bypass-client-approval`,
                                { reason: bypassReason },
                                {
                                    onSuccess: () => {
                                        onOpenChange(false);
                                        setBypassReason('');
                                    },
                                },
                            );
                        }}
                        disabled={bypassReason.trim().length < 10}
                    >
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Bypass & Notify Client
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
