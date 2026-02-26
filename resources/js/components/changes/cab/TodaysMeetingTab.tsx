import { Link, router, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Clock,
    FileText,
    Minus,
    Plus,
    RefreshCw,
    Search,
    ShieldOff,
} from 'lucide-react';
import { useState } from 'react';
import { TalkingPointsSection, type TalkingPoint } from '@/components/changes/cab/TalkingPointsSection';
import { CabVotePanel } from '@/components/changes/CabVotePanel';
import { CollapsibleSection } from '@/components/changes/CollapsibleSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CabVoteSummary, UserCabVote } from '@/types';

interface ChangeRequest {
    id: number;
    change_id: string;
    title: string;
    status: string;
    priority: string;
    description?: string | null;
    risk_level?: string | null;
    change_type?: string | null;
    client?: { name: string } | null;
    requester?: { name: string } | null;
    scheduled_start_date?: string | null;
}

interface Meeting {
    id: number;
    status: 'planned' | 'completed' | 'cancelled';
    agenda_items: number;
}

interface TodaysMeetingTabProps {
    meetingDate: string;
    meeting: Meeting | null;
    pendingReviews: ChangeRequest[];
    upcomingChanges: ChangeRequest[];
    voteSummaries: Record<number, CabVoteSummary>;
    userVotes: Record<number, UserCabVote>;
    isCabMember: boolean;
    canManageMeetings: boolean;
    availableChanges: ChangeRequest[];
    talkingPoints?: TalkingPoint[];
}

const priorityColors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
};

const statusColors: Record<string, string> = {
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    scheduled: 'bg-purple-100 text-purple-800',
};

export function TodaysMeetingTab({
    meetingDate,
    meeting,
    pendingReviews,
    upcomingChanges,
    voteSummaries,
    userVotes,
    isCabMember,
    canManageMeetings,
    availableChanges,
    talkingPoints = [],
}: TodaysMeetingTabProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [closeMeetingOpen, setCloseMeetingOpen] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkAdding, setBulkAdding] = useState(false);

    const generateForm = useForm({ meeting_date: meetingDate, auto_populate: true });
    const closeMeetingForm = useForm({
        status: 'completed' as string,
        agenda_notes: '',
        minutes: '',
    });

    const votedCount = pendingReviews.filter(
        (cr) => userVotes[cr.id] != null
    ).length;
    const totalItems = pendingReviews.length;
    const progressPercent = totalItems > 0 ? Math.round((votedCount / totalItems) * 100) : 0;

    const formattedDate = new Date(meetingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const canEditAgenda = canManageMeetings && meeting != null && meeting.status === 'planned';

    // Filter available changes by search term
    const filteredAvailable = availableChanges.filter((change) => {
        if (!searchFilter.trim()) return true;
        const term = searchFilter.toLowerCase();
        return (
            change.change_id.toLowerCase().includes(term) ||
            change.title.toLowerCase().includes(term) ||
            change.client?.name?.toLowerCase().includes(term) ||
            change.requester?.name?.toLowerCase().includes(term) ||
            change.priority.toLowerCase().includes(term) ||
            change.change_type?.toLowerCase().includes(term)
        );
    });

    const allFilteredSelected = filteredAvailable.length > 0 && filteredAvailable.every((c) => selectedIds.has(c.id));

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allFilteredSelected) {
            // Deselect all filtered items
            setSelectedIds((prev) => {
                const next = new Set(prev);
                filteredAvailable.forEach((c) => next.delete(c.id));
                return next;
            });
        } else {
            // Select all filtered items
            setSelectedIds((prev) => {
                const next = new Set(prev);
                filteredAvailable.forEach((c) => next.add(c.id));
                return next;
            });
        }
    };

    const handleBulkAdd = () => {
        if (!meeting || selectedIds.size === 0) return;
        setBulkAdding(true);
        router.post(
            `/cab-agenda/meetings/${meeting.id}/items`,
            { change_request_ids: [...selectedIds] },
            {
                preserveScroll: true,
                onFinish: () => {
                    setBulkAdding(false);
                    setSelectedIds(new Set());
                },
            }
        );
    };

    return (
        <div className="space-y-4">
            {/* Meeting Controls */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{formattedDate}</p>
                                <p className="text-sm text-muted-foreground">
                                    {meeting ? (
                                        <>
                                            <Badge
                                                variant={meeting.status === 'completed' ? 'default' : 'secondary'}
                                                className="mr-2"
                                            >
                                                {meeting.status}
                                            </Badge>
                                            {meeting.agenda_items} agenda item(s)
                                        </>
                                    ) : (
                                        'No meeting generated yet'
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {canManageMeetings && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={generateForm.processing}
                                        onClick={() =>
                                            generateForm.post('/cab-agenda/meetings/generate', {
                                                preserveScroll: true,
                                            })
                                        }
                                    >
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        {generateForm.processing ? 'Refreshing...' : 'Refresh Agenda'}
                                    </Button>
                                    {meeting && meeting.status === 'planned' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setCloseMeetingOpen(true)}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Close Meeting
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Talking Points / Checklist */}
            {meeting && (
                <TalkingPointsSection
                    meetingId={meeting.id}
                    talkingPoints={talkingPoints}
                    canEdit={canManageMeetings && meeting.status === 'planned'}
                />
            )}

            {/* Add Changes to Agenda — Bulk Select */}
            {canEditAgenda && availableChanges.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                Add Changes to Agenda
                            </CardTitle>
                            <Badge variant="secondary">{availableChanges.length} available</Badge>
                        </div>
                        <CardDescription>
                            Select the change requests to include in this meeting's agenda, then click "Add Selected".
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Search + Toolbar */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {availableChanges.length > 3 && (
                                <div className="relative flex-1 min-w-48">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Filter by ID, title, client, priority..."
                                        value={searchFilter}
                                        onChange={(e) => setSearchFilter(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            )}
                            <Button
                                size="sm"
                                disabled={selectedIds.size === 0 || bulkAdding}
                                onClick={handleBulkAdd}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                {bulkAdding
                                    ? 'Adding...'
                                    : `Add Selected (${selectedIds.size})`}
                            </Button>
                        </div>

                        {/* Select All header */}
                        <div className="flex items-center gap-3 px-3 py-2 border-b">
                            <Checkbox
                                checked={allFilteredSelected}
                                onCheckedChange={toggleSelectAll}
                                aria-label="Select all"
                            />
                            <span className="text-sm font-medium text-muted-foreground">
                                {allFilteredSelected
                                    ? 'Deselect all'
                                    : `Select all (${filteredAvailable.length})`}
                            </span>
                        </div>

                        {/* Change list */}
                        <div className="space-y-1 max-h-96 overflow-y-auto">
                            {filteredAvailable.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-3 text-center">
                                    {searchFilter.trim()
                                        ? 'No matching changes found.'
                                        : 'All pending changes are already on this meeting\'s agenda.'}
                                </p>
                            ) : (
                                filteredAvailable.map((change) => (
                                    <label
                                        key={change.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                            selectedIds.has(change.id)
                                                ? 'bg-primary/5 border-primary/30'
                                                : 'hover:bg-accent/50'
                                        }`}
                                    >
                                        <Checkbox
                                            checked={selectedIds.has(change.id)}
                                            onCheckedChange={() => toggleSelect(change.id)}
                                            aria-label={`Select ${change.change_id}`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    {change.change_id}
                                                </span>
                                                <Badge className={`${priorityColors[change.priority] || 'bg-slate-100'} text-xs`}>
                                                    {change.priority}
                                                </Badge>
                                                {change.change_type && (
                                                    <Badge variant="outline" className="text-xs capitalize">
                                                        {change.change_type.replaceAll('_', ' ')}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="font-medium truncate mt-0.5">{change.title}</p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {change.client?.name ?? 'Unknown Client'} &bull; {change.requester?.name ?? 'Unknown Requester'}
                                            </p>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Agenda Items */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Agenda Items
                    </CardTitle>
                    <CardDescription>
                        {totalItems === 0
                            ? 'No changes on the agenda yet. Add changes above or use "Refresh Agenda" to auto-populate.'
                            : `${totalItems} change${totalItems !== 1 ? 's' : ''} on the agenda for review`}
                    </CardDescription>
                    {/* Voting Progress Bar */}
                    {totalItems > 0 && isCabMember && (
                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-1.5">
                                <p className="text-sm font-medium">
                                    Voting Progress: {votedCount} of {totalItems} items voted
                                </p>
                                <span className="text-sm text-muted-foreground">{progressPercent}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-2">
                    {pendingReviews.map((change) => (
                        <AgendaItem
                            key={change.id}
                            change={change}
                            voteSummary={voteSummaries[change.id] ?? null}
                            userVote={userVotes[change.id] ?? null}
                            isCabMember={isCabMember}
                            canBypass={canManageMeetings}
                            isExpanded={expandedId === change.id}
                            onToggle={() =>
                                setExpandedId(expandedId === change.id ? null : change.id)
                            }
                            meetingId={meeting?.id ?? null}
                            canRemove={canEditAgenda}
                        />
                    ))}
                </CardContent>
            </Card>

            {/* Upcoming Changes */}
            {upcomingChanges.length > 0 && (
                <CollapsibleSection
                    title="Upcoming Changes This Week"
                    icon={Calendar}
                    count={upcomingChanges.length}
                >
                    <div className="space-y-2">
                        {upcomingChanges.map((change) => (
                            <Link key={change.id} href={`/changes/${change.id}`}>
                                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {change.change_id}
                                            </span>
                                            <Badge className={`${statusColors[change.status] || 'bg-slate-100'} text-xs`}>
                                                {change.status.replaceAll('_', ' ')}
                                            </Badge>
                                            <Badge className={`${priorityColors[change.priority] || 'bg-slate-100'} text-xs`}>
                                                {change.priority}
                                            </Badge>
                                        </div>
                                        <p className="font-medium truncate mt-1">{change.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {change.client?.name ?? 'Unknown Client'}
                                        </p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Close Meeting Dialog */}
            <Dialog open={closeMeetingOpen} onOpenChange={setCloseMeetingOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Close CAB Meeting</DialogTitle>
                        <DialogDescription>
                            Record meeting minutes and close the meeting for {formattedDate}.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!meeting) return;
                            closeMeetingForm.put(`/cab-agenda/meetings/${meeting.id}`, {
                                preserveScroll: true,
                                onSuccess: () => setCloseMeetingOpen(false),
                            });
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Agenda Notes</label>
                            <Textarea
                                rows={3}
                                value={closeMeetingForm.data.agenda_notes}
                                onChange={(e) => closeMeetingForm.setData('agenda_notes', e.target.value)}
                                placeholder="Key discussion points..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Meeting Minutes</label>
                            <Textarea
                                rows={5}
                                value={closeMeetingForm.data.minutes}
                                onChange={(e) => closeMeetingForm.setData('minutes', e.target.value)}
                                placeholder="Detailed meeting minutes..."
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCloseMeetingOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={closeMeetingForm.processing}>
                                {closeMeetingForm.processing ? 'Saving...' : 'Close Meeting'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// --- Expandable Agenda Item ---

interface AgendaItemProps {
    change: ChangeRequest;
    voteSummary: CabVoteSummary | null;
    userVote: UserCabVote;
    isCabMember: boolean;
    canBypass: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    meetingId: number | null;
    canRemove: boolean;
}

function AgendaItem({
    change,
    voteSummary,
    userVote,
    isCabMember,
    canBypass,
    isExpanded,
    onToggle,
    meetingId,
    canRemove,
}: AgendaItemProps) {
    const hasVoted = userVote != null;
    const [removing, setRemoving] = useState(false);
    const [bypassOpen, setBypassOpen] = useState(false);
    const bypassForm = useForm({ reason: '' });

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRemoving(true);
        router.delete(`/cab-agenda/meetings/${meetingId}/items/${change.id}`, {
            preserveScroll: true,
            onFinish: () => setRemoving(false),
        });
    };

    return (
        <div className="rounded-lg border overflow-hidden">
            {/* Collapsed header */}
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left"
            >
                {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}

                {/* Vote status icon */}
                {hasVoted ? (
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                    <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-muted-foreground">
                            {change.change_id}
                        </span>
                        <Badge
                            className={`${priorityColors[change.priority] || 'bg-slate-100'} text-xs`}
                        >
                            {change.priority}
                        </Badge>
                        {change.change_type && (
                            <Badge variant="outline" className="text-xs capitalize">
                                {change.change_type.replaceAll('_', ' ')}
                            </Badge>
                        )}
                        {voteSummary && (
                            <span className="text-xs text-muted-foreground">
                                {voteSummary.total_votes} vote{voteSummary.total_votes !== 1 ? 's' : ''}
                                {voteSummary.quorum_met && (
                                    <span className="text-green-600 ml-1">Quorum met</span>
                                )}
                            </span>
                        )}
                    </div>
                    <p className="font-medium truncate">{change.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                        {change.client?.name ?? 'Unknown Client'} &bull; {change.requester?.name ?? 'Unknown Requester'}
                    </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {canRemove && meetingId && (
                        <Button
                            variant="ghost"
                            size="sm"
                            tabIndex={-1}
                            disabled={removing}
                            onClick={handleRemove}
                            className="text-muted-foreground hover:text-destructive"
                            title="Remove from agenda"
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                    )}
                    <Link
                        href={`/changes/${change.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0"
                    >
                        <Button variant="ghost" size="sm" tabIndex={-1}>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
                <div className="border-t p-4 bg-muted/30 space-y-4">
                    {/* Change details summary */}
                    <div className="grid gap-3 sm:grid-cols-3 text-sm">
                        {change.risk_level && (
                            <div>
                                <span className="text-muted-foreground">Risk Level:</span>{' '}
                                <span className="font-medium capitalize">{change.risk_level}</span>
                            </div>
                        )}
                        {change.change_type && (
                            <div>
                                <span className="text-muted-foreground">Type:</span>{' '}
                                <span className="font-medium capitalize">
                                    {change.change_type.replaceAll('_', ' ')}
                                </span>
                            </div>
                        )}
                        {change.scheduled_start_date && (
                            <div>
                                <span className="text-muted-foreground">Scheduled:</span>{' '}
                                <span className="font-medium">
                                    {new Date(change.scheduled_start_date).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                    {change.description && (
                        <p className="text-sm text-muted-foreground">{change.description}</p>
                    )}

                    {/* Inline vote panel or read-only summary */}
                    {voteSummary && isCabMember ? (
                        <CabVotePanel
                            changeId={change.id}
                            voteSummary={voteSummary}
                            userVote={userVote}
                        />
                    ) : voteSummary ? (
                        <div className="text-sm space-y-2">
                            <p className="font-medium">Vote Summary</p>
                            <div className="flex gap-4 text-muted-foreground">
                                <span>Approves: {voteSummary.approves}</span>
                                <span>Rejects: {voteSummary.rejects}</span>
                                <span>Abstains: {voteSummary.abstains}</span>
                                <span>
                                    Quorum: {voteSummary.quorum_met ? 'Met' : 'Pending'}
                                </span>
                            </div>
                            {voteSummary.votes.length > 0 && (
                                <div className="flex gap-2 flex-wrap mt-2">
                                    {voteSummary.votes.map((v, i) => (
                                        <Badge key={`${v.user}-${i}`} variant="outline" className="capitalize">
                                            {v.user}: {v.vote}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}

                    {/* Manager Bypass CAB Vote */}
                    {canBypass && change.status === 'pending_approval' && (
                        <div className="border-t pt-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                                onClick={() => setBypassOpen(true)}
                            >
                                <ShieldOff className="h-4 w-4 mr-1" />
                                Bypass CAB Vote
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Bypass Dialog */}
            <Dialog open={bypassOpen} onOpenChange={setBypassOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bypass CAB Voting</DialogTitle>
                        <DialogDescription>
                            Approve <span className="font-medium">{change.change_id}</span> without
                            waiting for CAB quorum. A reason is required for audit purposes.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            bypassForm.post(`/changes/${change.id}/bypass-cab-voting`, {
                                preserveScroll: true,
                                onSuccess: () => setBypassOpen(false),
                            });
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor={`bypass-reason-${change.id}`}>
                                Reason for Bypass <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id={`bypass-reason-${change.id}`}
                                rows={3}
                                value={bypassForm.data.reason}
                                onChange={(e) => bypassForm.setData('reason', e.target.value)}
                                placeholder="Explain why this change should skip normal CAB voting (min 10 characters)..."
                            />
                            {bypassForm.errors.reason && (
                                <p className="text-sm text-destructive">{bypassForm.errors.reason}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setBypassOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="default"
                                className="bg-orange-600 hover:bg-orange-700"
                                disabled={bypassForm.processing}
                            >
                                {bypassForm.processing ? 'Bypassing...' : 'Bypass & Approve'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
