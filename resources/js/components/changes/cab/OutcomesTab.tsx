import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import type { ElementType } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Meeting {
    id: number;
    meeting_date: string;
    status: 'planned' | 'completed' | 'cancelled';
    change_requests_count?: number;
    invited_members_count?: number;
    change_requests: Array<{
        id: number;
        change_id: string;
        title: string;
        status: string;
        priority: string;
        client?: { id: number; name: string } | null;
    }>;
}

interface HistoryItem {
    id: number;
    change_id: string;
    title: string;
    status: string;
    priority: string;
    decision: 'approved' | 'rejected' | 'pending';
    client?: { name?: string | null } | null;
    total_votes: number;
    approves: number;
    rejects: number;
    abstains: number;
    conditional_votes: number;
    votes: Array<{
        user: string;
        vote: 'approve' | 'reject' | 'abstain';
        comments?: string | null;
        conditional_terms?: string | null;
    }>;
}

interface OutcomesTabProps {
    meetings: Meeting[];
    history: HistoryItem[];
    historySummary: {
        total_reviewed: number;
        approved: number;
        rejected: number;
        pending: number;
        with_conditions: number;
    };
}

const decisionColors: Record<string, string> = {
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
};

function formatMeetingDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function OutcomesTab({ meetings, history, historySummary }: OutcomesTabProps) {
    const completedMeetings = meetings.filter((m) => m.status === 'completed');

    // Build a lookup of history items keyed by change id for vote data
    const historyByChangeId: Record<string, HistoryItem> = {};
    for (const item of history) {
        historyByChangeId[item.change_id] = item;
    }

    return (
        <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Reviewed"
                    value={historySummary.total_reviewed}
                    icon={BarChart3}
                    iconClassName="bg-slate-100 text-slate-700"
                />
                <StatCard
                    title="Approved"
                    value={historySummary.approved}
                    icon={CheckCircle}
                    iconClassName="bg-green-100 text-green-700"
                />
                <StatCard
                    title="Rejected"
                    value={historySummary.rejected}
                    icon={XCircle}
                    iconClassName="bg-red-100 text-red-700"
                />
                <StatCard
                    title="With Conditions"
                    value={historySummary.with_conditions}
                    icon={AlertTriangle}
                    iconClassName="bg-orange-100 text-orange-700"
                />
            </div>

            {/* Completed Meetings */}
            {completedMeetings.length === 0 ? (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center justify-center text-center py-8">
                            <div className="rounded-full bg-muted p-4 mb-4">
                                <BarChart3 className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-1">
                                No meeting outcomes to display yet.
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Outcomes will appear here once a CAB meeting has been completed.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                completedMeetings.map((meeting) => {
                    const changes = meeting.change_requests;

                    // Tally decisions for meeting summary
                    let approvedCount = 0;
                    let rejectedCount = 0;
                    let pendingCount = 0;

                    for (const cr of changes) {
                        const hi = historyByChangeId[cr.change_id];
                        if (hi) {
                            if (hi.decision === 'approved') approvedCount++;
                            else if (hi.decision === 'rejected') rejectedCount++;
                            else pendingCount++;
                        } else {
                            pendingCount++;
                        }
                    }

                    return (
                        <Card key={meeting.id}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>
                                        {formatMeetingDate(meeting.meeting_date)}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {changes.length} change{changes.length !== 1 ? 's' : ''} discussed
                                        {meeting.invited_members_count != null &&
                                            ` \u00b7 ${meeting.invited_members_count} members invited`}
                                    </p>
                                </div>
                                <Link href={`/cab-agenda/meetings/${meeting.id}/show`}>
                                    <Button variant="outline" size="sm">
                                        View meeting
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {changes.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No changes were discussed in this meeting.
                                    </p>
                                ) : (
                                    changes.map((cr) => {
                                        const hi = historyByChangeId[cr.change_id];
                                        const decision = hi?.decision ?? 'pending';
                                        const approves = hi?.approves ?? 0;
                                        const rejects = hi?.rejects ?? 0;
                                        const abstains = hi?.abstains ?? 0;
                                        const totalVotes = hi?.total_votes ?? 0;
                                        const conditionalVotes = hi?.conditional_votes ?? 0;

                                        return (
                                            <Link
                                                key={cr.id}
                                                href={`/changes/${cr.id}`}
                                            >
                                                <div className="rounded-lg border p-4 transition-colors hover:bg-accent">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge
                                                            className={
                                                                decisionColors[decision] ||
                                                                'bg-slate-100 text-slate-800'
                                                            }
                                                        >
                                                            {decision}
                                                        </Badge>
                                                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700">
                                                            {cr.change_id}
                                                        </span>
                                                        <span className="font-medium truncate">
                                                            {cr.title}
                                                        </span>
                                                        {conditionalVotes > 0 && (
                                                            <Badge className="bg-orange-100 text-orange-800">
                                                                With conditions
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {cr.client && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {cr.client.name}
                                                        </p>
                                                    )}

                                                    {/* Voting progress bar */}
                                                    {totalVotes > 0 && (
                                                        <div className="mt-3">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <span className="text-xs text-muted-foreground">
                                                                    Votes: {totalVotes}
                                                                </span>
                                                                <span className="text-xs text-green-700">
                                                                    {approves} approved
                                                                </span>
                                                                <span className="text-xs text-red-700">
                                                                    {rejects} rejected
                                                                </span>
                                                                <span className="text-xs text-slate-500">
                                                                    {abstains} abstained
                                                                </span>
                                                            </div>
                                                            <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
                                                                {approves > 0 && (
                                                                    <div
                                                                        className="bg-green-500 transition-all"
                                                                        style={{
                                                                            width: `${(approves / totalVotes) * 100}%`,
                                                                        }}
                                                                    />
                                                                )}
                                                                {rejects > 0 && (
                                                                    <div
                                                                        className="bg-red-500 transition-all"
                                                                        style={{
                                                                            width: `${(rejects / totalVotes) * 100}%`,
                                                                        }}
                                                                    />
                                                                )}
                                                                {abstains > 0 && (
                                                                    <div
                                                                        className="bg-slate-400 transition-all"
                                                                        style={{
                                                                            width: `${(abstains / totalVotes) * 100}%`,
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })
                                )}

                                {/* Meeting summary */}
                                {changes.length > 0 && (
                                    <div className="border-t pt-3 mt-3">
                                        <p className="text-sm text-muted-foreground">
                                            Meeting summary:{' '}
                                            <span className="text-green-700 font-medium">
                                                {approvedCount} approved
                                            </span>
                                            ,{' '}
                                            <span className="text-red-700 font-medium">
                                                {rejectedCount} rejected
                                            </span>
                                            ,{' '}
                                            <span className="text-yellow-700 font-medium">
                                                {pendingCount} pending
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })
            )}
        </div>
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
