import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Download,
    FileText,
    History,
    ShieldAlert,
    XCircle,
} from 'lucide-react';
import type { ElementType } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Vote = {
    user: string;
    vote: 'approve' | 'reject' | 'abstain';
    comments?: string | null;
    conditional_terms?: string | null;
    voted_at?: string | null;
};

type HistoryItem = {
    id: number;
    change_id: string;
    title: string;
    status: string;
    priority: string;
    decision: 'approved' | 'rejected' | 'pending';
    client?: { name?: string | null } | null;
    requester?: { name?: string | null } | null;
    total_votes: number;
    approves: number;
    rejects: number;
    abstains: number;
    conditional_votes: number;
    last_voted_at?: string | null;
    reviewed_at?: string | null;
    cab_conditions_status?: 'pending' | 'confirmed' | null;
    cab_conditions_confirmed_at?: string | null;
    archived_at?: string | null;
    votes: Vote[];
};

type Props = {
    history: HistoryItem[];
    summary: {
        total_reviewed: number;
        approved: number;
        rejected: number;
        pending: number;
        with_conditions: number;
    };
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

const decisionColors: Record<HistoryItem['decision'], string> = {
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
};

function formatDate(value?: string | null): string {
    if (!value) {
        return 'Not recorded';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return 'Not recorded';
    }

    return parsed.toLocaleString();
}

export default function CabHistory({ history, summary }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'CAB Agenda', href: '/cab-agenda' },
        { title: 'Review History', href: '/cab-agenda/history' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CAB Review History" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">CAB Review History</h1>
                        <p className="text-muted-foreground">
                            Historical record of CAB votes and outcomes.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a href="/export/cab-history">
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        </a>
                        <Link href="/cab-agenda">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Agenda
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard
                        title="Reviewed"
                        value={summary.total_reviewed}
                        icon={History}
                        iconClassName="bg-slate-100 text-slate-700"
                    />
                    <StatCard
                        title="Approved"
                        value={summary.approved}
                        icon={CheckCircle2}
                        iconClassName="bg-green-100 text-green-700"
                    />
                    <StatCard
                        title="Rejected"
                        value={summary.rejected}
                        icon={XCircle}
                        iconClassName="bg-red-100 text-red-700"
                    />
                    <StatCard
                        title="Pending"
                        value={summary.pending}
                        icon={Clock3}
                        iconClassName="bg-yellow-100 text-yellow-700"
                    />
                    <StatCard
                        title="With Conditions"
                        value={summary.with_conditions}
                        icon={ShieldAlert}
                        iconClassName="bg-orange-100 text-orange-700"
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {history.length === 0 ? (
                            <EmptyState
                                icon={History}
                                title="No CAB history yet"
                                description="CAB vote history will appear here after votes are recorded."
                            />
                        ) : (
                            <div className="space-y-3">
                                {history.map((item) => (
                                    <Link key={item.id} href={`/changes/${item.id}`}>
                                        <div className="rounded-lg border p-4 transition-colors hover:bg-accent">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    {item.change_id}
                                                </span>
                                                <Badge className={decisionColors[item.decision]}>
                                                    {item.decision}
                                                </Badge>
                                                <Badge
                                                    className={
                                                        statusColors[item.status] || 'bg-slate-100'
                                                    }
                                                >
                                                    {item.status.replaceAll('_', ' ')}
                                                </Badge>
                                                {item.archived_at && (
                                                    <Badge variant="outline">Archived</Badge>
                                                )}
                                                {item.conditional_votes > 0 && (
                                                    <Badge className="bg-orange-100 text-orange-800">
                                                        Conditions included
                                                    </Badge>
                                                )}
                                                {item.cab_conditions_status === 'pending' && (
                                                    <Badge className="bg-yellow-100 text-yellow-800">
                                                        Requester confirmation pending
                                                    </Badge>
                                                )}
                                                {item.cab_conditions_status === 'confirmed' && (
                                                    <Badge className="bg-green-100 text-green-800">
                                                        Conditions confirmed
                                                    </Badge>
                                                )}
                                            </div>

                                            <p className="mt-2 font-semibold">{item.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.client?.name ?? 'Unknown Client'} • Requested by{' '}
                                                {item.requester?.name ?? 'Unknown Requester'}
                                            </p>

                                            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                                <FileText className="h-4 w-4" />
                                                <span>
                                                    Votes: {item.total_votes} (Approve {item.approves},
                                                    Reject {item.rejects}, Abstain {item.abstains})
                                                </span>
                                            </div>

                                            {item.votes.length > 0 && (
                                                <div className="mt-3 flex gap-2 flex-wrap">
                                                    {item.votes.map((vote, index) => (
                                                        <Badge
                                                            key={`${item.id}-${vote.user}-${index}`}
                                                            variant="outline"
                                                            className="capitalize"
                                                        >
                                                            {vote.user}: {vote.vote}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                                <p>Last vote: {formatDate(item.last_voted_at)}</p>
                                                <p>
                                                    Decision recorded:{' '}
                                                    {formatDate(item.reviewed_at ?? item.last_voted_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    iconClassName,
}: {
    title: string;
    value: number;
    icon: ElementType;
    iconClassName: string;
}) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${iconClassName}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">{title}</p>
                        <p className="text-xl font-bold">{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
