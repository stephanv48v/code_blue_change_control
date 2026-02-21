import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock3, ThumbsDown, Vote } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type VoteValue = 'approve' | 'approve_with_conditions' | 'reject' | 'abstain';

type VoteSummary = {
    total_votes: number;
    approves: number;
    rejects: number;
    abstains: number;
    quorum_met: boolean;
    votes: Array<{
        user: string;
        vote: 'approve' | 'reject' | 'abstain';
        comments?: string | null;
        conditional_terms?: string | null;
    }>;
};

type Props = {
    changeRequest: {
        id: number;
        change_id: string;
        title: string;
        status: string;
    };
    voteSummary: VoteSummary;
    userVote?: {
        vote: VoteValue;
        comments?: string | null;
        conditions?: string | null;
    } | null;
};

export default function CabVote({ changeRequest, voteSummary, userVote }: Props) {
    const [conditionsDialogOpen, setConditionsDialogOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'CAB Agenda', href: '/cab-agenda' },
        { title: changeRequest.change_id, href: `/changes/${changeRequest.id}` },
        { title: 'CAB Vote', href: `/cab-agenda/changes/${changeRequest.id}/vote` },
    ];

    const { data, setData, post, processing, errors } = useForm({
        vote: (userVote?.vote ?? 'approve') as VoteValue,
        comments: userVote?.comments ?? '',
        conditions: userVote?.conditions ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (data.vote === 'approve_with_conditions' && !data.conditions.trim()) {
            setConditionsDialogOpen(true);

            return;
        }

        post(`/cab-agenda/changes/${changeRequest.id}/vote`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`CAB Vote - ${changeRequest.change_id}`} />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold">{changeRequest.title}</h1>
                    <p className="text-sm text-muted-foreground">{changeRequest.change_id}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard label="Total Votes" value={voteSummary.total_votes} icon={Vote} />
                    <StatCard label="Approves" value={voteSummary.approves} icon={CheckCircle2} />
                    <StatCard label="Rejects" value={voteSummary.rejects} icon={ThumbsDown} />
                    <StatCard
                        label="Quorum"
                        value={voteSummary.quorum_met ? 'Met' : 'Pending'}
                        icon={Clock3}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Cast Your Vote</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Vote</Label>
                                <Select
                                    value={data.vote}
                                    onValueChange={(value) => {
                                        const voteValue = value as VoteValue;
                                        setData('vote', voteValue);

                                        if (voteValue === 'approve_with_conditions') {
                                            setConditionsDialogOpen(true);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="approve">Approve</SelectItem>
                                        <SelectItem value="approve_with_conditions">
                                            Approve with Conditions
                                        </SelectItem>
                                        <SelectItem value="reject">Reject</SelectItem>
                                        <SelectItem value="abstain">Abstain</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.vote && <p className="text-sm text-destructive">{errors.vote}</p>}
                            </div>

                            {data.vote === 'approve_with_conditions' && (
                                <div className="rounded border p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-medium">CAB Conditions</p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setConditionsDialogOpen(true)}
                                        >
                                            Edit Conditions
                                        </Button>
                                    </div>
                                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                                        {data.conditions.trim() || 'No conditions entered yet.'}
                                    </p>
                                    {errors.conditions && (
                                        <p className="mt-2 text-sm text-destructive">{errors.conditions}</p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Comments</Label>
                                <Textarea
                                    value={data.comments}
                                    onChange={(e) => setData('comments', e.target.value)}
                                    rows={4}
                                />
                                {errors.comments && (
                                    <p className="text-sm text-destructive">{errors.comments}</p>
                                )}
                            </div>

                            <Button type="submit" disabled={processing}>
                                {data.vote === 'approve_with_conditions'
                                    ? 'Save Conditional Approval'
                                    : 'Save Vote'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recorded Votes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {voteSummary.votes.length === 0 && (
                            <p className="text-sm text-muted-foreground">No votes recorded yet.</p>
                        )}
                        {voteSummary.votes.map((vote, index) => (
                            <div key={`${vote.user}-${index}`} className="rounded border p-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{vote.user}</span>
                                    <Badge variant="outline" className="capitalize">
                                        {vote.vote}
                                    </Badge>
                                </div>
                                {vote.comments && (
                                    <p className="mt-1 text-sm text-muted-foreground">{vote.comments}</p>
                                )}
                                {vote.conditional_terms && (
                                    <div className="mt-2 rounded border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-900">
                                        <span className="font-medium">Conditions:</span>{' '}
                                        {vote.conditional_terms}
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={conditionsDialogOpen} onOpenChange={setConditionsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approval Conditions</DialogTitle>
                        <DialogDescription>
                            Enter CAB conditions that the requester must confirm before scheduling.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="conditions">Conditions *</Label>
                        <Textarea
                            id="conditions"
                            rows={5}
                            value={data.conditions}
                            onChange={(e) => setData('conditions', e.target.value)}
                            placeholder="Example: 1) Notify users 24h in advance. 2) Run rollback drill first."
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConditionsDialogOpen(false)}
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: number | string;
    icon: React.ElementType;
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-3 p-4">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-semibold">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
