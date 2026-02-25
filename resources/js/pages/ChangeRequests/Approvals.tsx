import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Approval = {
    id: number;
    type: 'client' | 'cab';
    status: 'pending' | 'approved' | 'rejected';
    comments?: string | null;
    responded_at?: string | null;
    due_at?: string | null;
    reminder_sent_at?: string | null;
    escalated_at?: string | null;
    escalation_level?: number;
    notification_status?: string | null;
    client_contact?: { name: string } | null;
    user?: { name: string } | null;
};

type Props = {
    changeRequest: {
        id: number;
        change_id: string;
        title: string;
        approvals?: Approval[];
        cab_votes?: Array<{
            id: number;
            vote: 'approve' | 'reject' | 'abstain';
            comments?: string | null;
            user?: { name: string } | null;
        }>;
    };
    cabSummary: {
        total_votes: number;
        approves: number;
        rejects: number;
        abstains: number;
        quorum_met: boolean;
    };
};

export default function Approvals({ changeRequest, cabSummary }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Change Requests', href: '/changes' },
        { title: changeRequest.change_id, href: `/changes/${changeRequest.id}` },
        { title: 'Approvals', href: `/changes/${changeRequest.id}/approvals` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Approvals - ${changeRequest.change_id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold">{changeRequest.title}</h1>
                    <p className="text-muted-foreground">{changeRequest.change_id}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Client Approvals</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {(changeRequest.approvals ?? []).length === 0 && (
                            <p className="text-sm text-muted-foreground">No approval records yet.</p>
                        )}
                        {(changeRequest.approvals ?? []).map((approval) => (
                            <div key={approval.id} className="rounded border p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-medium">
                                        {approval.client_contact?.name ??
                                            approval.user?.name ??
                                            'Approval'}
                                    </span>
                                    <Badge variant={approvalStatusToVariant(approval.status)}>
                                        {approval.status}
                                    </Badge>
                                </div>
                                {approval.comments && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {approval.comments}
                                    </p>
                                )}
                                {approval.status === 'pending' && approval.due_at && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Due: {new Date(approval.due_at).toLocaleString()}
                                    </p>
                                )}
                                {approval.reminder_sent_at && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Reminder sent: {new Date(approval.reminder_sent_at).toLocaleString()}
                                    </p>
                                )}
                                {approval.escalated_at && (
                                    <p className="mt-1 text-xs text-destructive">
                                        Escalated (L{approval.escalation_level ?? 1}) at{' '}
                                        {new Date(approval.escalated_at).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>CAB Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            <SummaryItem label="Total Votes" value={cabSummary.total_votes} />
                            <SummaryItem label="Approves" value={cabSummary.approves} />
                            <SummaryItem label="Rejects" value={cabSummary.rejects} />
                            <SummaryItem label="Abstains" value={cabSummary.abstains} />
                            <SummaryItem
                                label="Quorum"
                                value={cabSummary.quorum_met ? 'Met' : 'Pending'}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function SummaryItem({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
        </div>
    );
}

function approvalStatusToVariant(status: 'pending' | 'approved' | 'rejected') {
    if (status === 'approved') {
        return 'default' as const;
    }

    if (status === 'rejected') {
        return 'destructive' as const;
    }

    return 'secondary' as const;
}
