import { useForm } from '@inertiajs/react';
import { CheckCircle2, Clock3, ThumbsDown, Vote } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import type { CabVoteSummary, UserCabVote } from '@/types';

type VoteValue = 'approve' | 'approve_with_conditions' | 'reject' | 'abstain';

interface CabVotePanelProps {
    changeId: number;
    voteSummary: CabVoteSummary;
    userVote: UserCabVote;
}

export function CabVotePanel({ changeId, voteSummary, userVote }: CabVotePanelProps) {
    const [conditionsDialogOpen, setConditionsDialogOpen] = useState(false);

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

        if (data.vote === 'reject' && !data.comments.trim()) {
            return;
        }

        post(`/cab-agenda/vote/${changeId}`, { preserveScroll: true });
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
                <StatCard label="Total Votes" value={voteSummary.total_votes} icon={Vote} />
                <StatCard label="Approves" value={voteSummary.approves} icon={CheckCircle2} />
                <StatCard label="Rejects" value={voteSummary.rejects} icon={ThumbsDown} />
                <StatCard
                    label="Quorum"
                    value={voteSummary.quorum_met ? 'Met' : 'Pending'}
                    icon={Clock3}
                />
            </div>

            <form onSubmit={submit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label>Your Vote</Label>
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

                    <div className="space-y-1.5">
                        <Label>
                            {data.vote === 'reject' ? (
                                <>Reason for Rejection <span className="text-destructive">*</span></>
                            ) : (
                                'Comments'
                            )}
                        </Label>
                        <Textarea
                            value={data.comments}
                            onChange={(e) => setData('comments', e.target.value)}
                            rows={2}
                            placeholder={
                                data.vote === 'reject'
                                    ? 'Provide a reason for rejecting this change...'
                                    : 'Optional comments...'
                            }
                            className={
                                data.vote === 'reject' && !data.comments.trim()
                                    ? 'border-destructive/50 focus-visible:border-destructive'
                                    : undefined
                            }
                        />
                        {data.vote === 'reject' && !data.comments.trim() && (
                            <p className="text-xs text-destructive">A reason is required when rejecting.</p>
                        )}
                    </div>
                </div>

                {data.vote === 'approve_with_conditions' && (
                    <div className="rounded border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950/20">
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
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                            {data.conditions.trim() || 'No conditions entered yet.'}
                        </p>
                    </div>
                )}

                <Button type="submit" disabled={processing}>
                    {userVote ? 'Update Vote' : 'Cast Vote'}
                </Button>
            </form>

            {voteSummary.votes.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium">Recorded Votes</p>
                    {voteSummary.votes.map((vote, index) => (
                        <div
                            key={`${vote.user}-${index}`}
                            className="flex items-center justify-between rounded border p-2"
                        >
                            <span className="text-sm font-medium">{vote.user}</span>
                            <Badge variant="outline" className="capitalize">
                                {vote.vote}
                            </Badge>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={conditionsDialogOpen} onOpenChange={setConditionsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approval Conditions</DialogTitle>
                        <DialogDescription>
                            Enter conditions the requester must confirm before scheduling.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        rows={5}
                        value={data.conditions}
                        onChange={(e) => setData('conditions', e.target.value)}
                        placeholder="Example: 1) Notify users 24h in advance. 2) Run rollback drill first."
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConditionsDialogOpen(false)}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
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
            <CardContent className="flex items-center gap-3 p-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
