import { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Users,
    CalendarDays,
    CheckCircle,
    Clock,
    FileText,
    Plus,
    Vote,
    Shield,
    Search,
    ChevronDown,
    ChevronRight,
    Minus,
    ShieldOff,
    ArrowRight,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { TalkingPointsSection } from '@/components/changes/cab/TalkingPointsSection';
import { CabVotePanel } from '@/components/changes/CabVotePanel';
import type { CabVoteSummary, UserCabVote, CabMember, CabMeetingDetail, BreadcrumbItem, SharedData } from '@/types';

interface Props {
    meeting: CabMeetingDetail;
    voteSummaries: Record<number, CabVoteSummary>;
    userVotes: Record<number, UserCabVote>;
    availableChanges: Array<{
        id: number;
        change_id: string;
        title: string;
        status: string;
        priority: string;
        client?: { name: string } | null;
        requester?: { name: string } | null;
    }>;
    cabMembers: CabMember[];
}

const priorityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
    critical: 'bg-red-200 text-red-900',
};

const meetingStatusColors: Record<string, string> = {
    planned: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

export default function MeetingShow({
    meeting,
    voteSummaries,
    userVotes,
    availableChanges,
    cabMembers,
}: Props) {
    const { flash, auth } = usePage<SharedData>().props;
    const isCabMember = auth.user?.roles?.includes('CAB Member') ?? false;
    const permissions = auth.user?.permissions ?? [];
    const canManageMeetings = permissions.includes('changes.approve');

    const isPlanned = meeting.status === 'planned';

    // Expanded agenda items
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // Close meeting dialog
    const [closeMeetingOpen, setCloseMeetingOpen] = useState(false);
    const closeMeetingForm = useForm({
        status: 'completed' as string,
        agenda_notes: meeting.agenda_notes ?? '',
        minutes: meeting.minutes ?? '',
    });

    // Notes & minutes form
    const [notesSaving, setNotesSaving] = useState(false);
    const [notesData, setNotesData] = useState({
        agenda_notes: meeting.agenda_notes ?? '',
        minutes: meeting.minutes ?? '',
    });

    // Add changes state
    const [searchFilter, setSearchFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkAdding, setBulkAdding] = useState(false);

    // Invite members dialog
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());
    const [inviting, setInviting] = useState(false);

    const formattedDate = new Date(meeting.meeting_date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'CAB Agenda', href: '/cab-agenda' },
        { title: `Meeting - ${formattedDate}`, href: '#' },
    ];

    // Filter available changes by search
    const filteredAvailable = availableChanges.filter((change) => {
        if (!searchFilter.trim()) return true;
        const term = searchFilter.toLowerCase();
        return (
            change.change_id.toLowerCase().includes(term) ||
            change.title.toLowerCase().includes(term) ||
            change.client?.name?.toLowerCase().includes(term) ||
            change.requester?.name?.toLowerCase().includes(term) ||
            change.priority.toLowerCase().includes(term)
        );
    });

    const filteredIds = new Set(filteredAvailable.map((c) => c.id));
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
            setSelectedIds((prev) => {
                const next = new Set(prev);
                filteredAvailable.forEach((c) => next.delete(c.id));
                return next;
            });
        } else {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                filteredAvailable.forEach((c) => next.add(c.id));
                return next;
            });
        }
    };

    const handleBulkAdd = () => {
        if (selectedIds.size === 0) return;
        setBulkAdding(true);
        router.post(
            `/cab-agenda/meetings/${meeting.id}/items`,
            { change_request_ids: [...selectedIds] },
            {
                preserveScroll: true,
                onFinish: () => {
                    setBulkAdding(false);
                    setSelectedIds(new Set());
                    setSearchFilter('');
                },
            },
        );
    };

    const handleSaveNotes = () => {
        setNotesSaving(true);
        router.put(
            `/cab-agenda/meetings/${meeting.id}`,
            notesData,
            {
                preserveScroll: true,
                onFinish: () => setNotesSaving(false),
            },
        );
    };

    const handleCloseMeeting = (e: React.FormEvent) => {
        e.preventDefault();
        closeMeetingForm.put(`/cab-agenda/meetings/${meeting.id}`, {
            preserveScroll: true,
            onSuccess: () => setCloseMeetingOpen(false),
        });
    };

    const handleInviteMembers = () => {
        if (selectedMemberIds.size === 0) return;
        setInviting(true);
        router.post(
            `/cab-agenda/meetings/${meeting.id}/invite`,
            { user_ids: [...selectedMemberIds] },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setInviteDialogOpen(false);
                    setSelectedMemberIds(new Set());
                },
                onFinish: () => setInviting(false),
            },
        );
    };

    const toggleMemberSelect = (id: number) => {
        setSelectedMemberIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Compute meeting stats
    const totalAgendaItems = meeting.change_requests.length;
    const totalPossibleVotes = totalAgendaItems * meeting.invited_members.length;
    const totalVotesCast = Object.values(voteSummaries).reduce(
        (sum, vs) => sum + vs.total_votes,
        0,
    );

    // Already-invited member IDs for filtering the invite dialog
    const invitedMemberIds = new Set(meeting.invited_members.map((m) => m.id));
    const uninvitedMembers = cabMembers.filter((m) => !invitedMemberIds.has(m.id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Meeting - ${formattedDate}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
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
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-bold">{formattedDate}</h1>
                                <Badge className={meetingStatusColors[meeting.status] ?? 'bg-slate-100 text-slate-800'}>
                                    {meeting.status}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {totalAgendaItems} agenda item{totalAgendaItems !== 1 ? 's' : ''} &bull;{' '}
                                {meeting.invited_members.length} invited member{meeting.invited_members.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/cab-agenda">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Back to CAB Agenda
                            </Button>
                        </Link>
                        {isPlanned && canManageMeetings && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCloseMeetingOpen(true)}
                            >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Close Meeting
                            </Button>
                        )}
                    </div>
                </div>

                {/* Two-column layout */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Talking Points */}
                        <TalkingPointsSection
                            meetingId={meeting.id}
                            talkingPoints={meeting.talking_points ?? []}
                            canEdit={canManageMeetings && isPlanned}
                        />

                        {/* Agenda Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Agenda Items ({meeting.change_requests.length})
                                </CardTitle>
                                <CardDescription>
                                    {meeting.change_requests.length === 0
                                        ? 'No changes on the agenda yet.'
                                        : `${meeting.change_requests.length} change${meeting.change_requests.length !== 1 ? 's' : ''} on the agenda for review`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {meeting.change_requests.map((change) => {
                                    const voteSummary = voteSummaries[change.id] ?? null;
                                    const userVote = userVotes[change.id] ?? null;
                                    const isExpanded = expandedId === change.id;
                                    const hasVoted = userVote != null;
                                    const voteCount = voteSummary?.total_votes ?? 0;
                                    const memberCount = meeting.invited_members.length;

                                    return (
                                        <div key={change.id} className="rounded-lg border overflow-hidden">
                                            {/* Collapsed header */}
                                            <button
                                                type="button"
                                                onClick={() => setExpandedId(isExpanded ? null : change.id)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left"
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                )}

                                                {hasVoted ? (
                                                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                ) : (
                                                    <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="outline" className="text-xs font-mono">
                                                            {change.change_id}
                                                        </Badge>
                                                        <Badge className={`${priorityColors[change.priority] || 'bg-slate-100 text-slate-800'} text-xs`}>
                                                            {change.priority}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {voteCount}/{memberCount} votes
                                                        </span>
                                                    </div>
                                                    <p className="font-medium truncate mt-0.5">{change.title}</p>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {change.client?.name ?? 'Unknown Client'}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {canManageMeetings && isPlanned && (
                                                        <RemoveItemButton
                                                            meetingId={meeting.id}
                                                            changeId={change.id}
                                                        />
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
                                                        <div>
                                                            <span className="text-muted-foreground">Status:</span>{' '}
                                                            <span className="font-medium capitalize">
                                                                {change.status.replaceAll('_', ' ')}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {change.description && (
                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                            {change.description}
                                                        </p>
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
                                                    {canManageMeetings && change.status === 'pending_approval' && (
                                                        <BypassCabButton changeId={change.id} changeLabel={change.change_id} />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {meeting.change_requests.length === 0 && (
                                    <p className="text-sm text-muted-foreground py-4 text-center">
                                        No agenda items yet. Add changes below to get started.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Add Changes Card */}
                        {isPlanned && canManageMeetings && (
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
                                        Select change requests to include in this meeting's agenda.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {availableChanges.length === 0 ? (
                                        <p className="text-sm text-muted-foreground py-3 text-center">
                                            All pending changes are already on this meeting's agenda.
                                        </p>
                                    ) : (
                                        <>
                                            {/* Search + Add button */}
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
                                                        No matching changes found.
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
                                                                </div>
                                                                <p className="font-medium truncate mt-0.5">{change.title}</p>
                                                                <p className="text-sm text-muted-foreground truncate">
                                                                    {change.client?.name ?? 'Unknown Client'} &bull; {change.requester?.name ?? 'Unknown'}
                                                                </p>
                                                            </div>
                                                        </label>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Notes & Minutes Card */}
                        {canManageMeetings && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Notes & Minutes
                                    </CardTitle>
                                    <CardDescription>
                                        Record agenda notes and meeting minutes.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="agenda-notes">Agenda Notes</Label>
                                        <Textarea
                                            id="agenda-notes"
                                            rows={3}
                                            value={notesData.agenda_notes}
                                            onChange={(e) =>
                                                setNotesData((prev) => ({ ...prev, agenda_notes: e.target.value }))
                                            }
                                            placeholder="Key discussion points and agenda notes..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="minutes">Minutes</Label>
                                        <Textarea
                                            id="minutes"
                                            rows={6}
                                            value={notesData.minutes}
                                            onChange={(e) =>
                                                setNotesData((prev) => ({ ...prev, minutes: e.target.value }))
                                            }
                                            placeholder="Detailed meeting minutes..."
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSaveNotes}
                                        disabled={notesSaving}
                                    >
                                        {notesSaving ? 'Saving...' : 'Save Notes'}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right column */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Invited Members Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Invited Members
                                    </CardTitle>
                                    <Badge variant="secondary">{meeting.invited_members.length}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {meeting.invited_members.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No members have been invited yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {meeting.invited_members.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center gap-3 rounded-lg border p-3"
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {canManageMeetings && isPlanned && uninvitedMembers.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => setInviteDialogOpen(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Invite More
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Meeting Stats Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Vote className="h-5 w-5" />
                                    Meeting Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Total Agenda Items</span>
                                        <span className="font-medium">{totalAgendaItems}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Votes Cast / Possible</span>
                                        <span className="font-medium">
                                            {totalVotesCast} / {totalPossibleVotes}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Status</span>
                                        <Badge className={meetingStatusColors[meeting.status] ?? 'bg-slate-100 text-slate-800'}>
                                            {meeting.status}
                                        </Badge>
                                    </div>
                                    {meeting.creator && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Created By</span>
                                            <span className="font-medium">{meeting.creator.name}</span>
                                        </div>
                                    )}
                                    {meeting.completer && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Completed By</span>
                                            <span className="font-medium">{meeting.completer.name}</span>
                                        </div>
                                    )}
                                    {meeting.completed_at && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Completed At</span>
                                            <span className="font-medium">
                                                {new Date(meeting.completed_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Read-only notes display for non-managers */}
                        {!canManageMeetings && (meeting.agenda_notes || meeting.minutes) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Meeting Notes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {meeting.agenda_notes && (
                                        <div>
                                            <p className="text-sm font-medium mb-1">Agenda Notes</p>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {meeting.agenda_notes}
                                            </p>
                                        </div>
                                    )}
                                    {meeting.minutes && (
                                        <div>
                                            <p className="text-sm font-medium mb-1">Minutes</p>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {meeting.minutes}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Close Meeting Dialog */}
            <Dialog open={closeMeetingOpen} onOpenChange={setCloseMeetingOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Close CAB Meeting</DialogTitle>
                        <DialogDescription>
                            Record meeting minutes and close the meeting for {formattedDate}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCloseMeeting} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="close-agenda-notes">Agenda Notes</Label>
                            <Textarea
                                id="close-agenda-notes"
                                rows={3}
                                value={closeMeetingForm.data.agenda_notes}
                                onChange={(e) => closeMeetingForm.setData('agenda_notes', e.target.value)}
                                placeholder="Key discussion points..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="close-minutes">Meeting Minutes</Label>
                            <Textarea
                                id="close-minutes"
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

            {/* Invite Members Dialog */}
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite CAB Members</DialogTitle>
                        <DialogDescription>
                            Select additional CAB members to invite to this meeting.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {uninvitedMembers.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-3 text-center">
                                All CAB members have already been invited.
                            </p>
                        ) : (
                            uninvitedMembers.map((member) => (
                                <label
                                    key={member.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        selectedMemberIds.has(member.id)
                                            ? 'bg-primary/5 border-primary/30'
                                            : 'hover:bg-accent/50'
                                    }`}
                                >
                                    <Checkbox
                                        checked={selectedMemberIds.has(member.id)}
                                        onCheckedChange={() => toggleMemberSelect(member.id)}
                                        aria-label={`Invite ${member.name}`}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">{member.name}</p>
                                        <p className="text-xs text-muted-foreground">{member.email}</p>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setInviteDialogOpen(false);
                                setSelectedMemberIds(new Set());
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleInviteMembers}
                            disabled={selectedMemberIds.size === 0 || inviting}
                        >
                            {inviting
                                ? 'Inviting...'
                                : `Invite (${selectedMemberIds.size})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

// --- Helper: Remove item button ---
function RemoveItemButton({ meetingId, changeId }: { meetingId: number; changeId: number }) {
    const [removing, setRemoving] = useState(false);

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRemoving(true);
        router.delete(`/cab-agenda/meetings/${meetingId}/items/${changeId}`, {
            preserveScroll: true,
            onFinish: () => setRemoving(false),
        });
    };

    return (
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
    );
}

// --- Helper: Bypass CAB Vote button + dialog ---
function BypassCabButton({ changeId, changeLabel }: { changeId: number; changeLabel: string }) {
    const [bypassOpen, setBypassOpen] = useState(false);
    const bypassForm = useForm({ reason: '' });

    return (
        <>
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

            <Dialog open={bypassOpen} onOpenChange={setBypassOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bypass CAB Voting</DialogTitle>
                        <DialogDescription>
                            Approve <span className="font-medium">{changeLabel}</span> without
                            waiting for CAB quorum. A reason is required for audit purposes.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            bypassForm.post(`/changes/${changeId}/bypass-cab-voting`, {
                                preserveScroll: true,
                                onSuccess: () => setBypassOpen(false),
                            });
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor={`bypass-reason-${changeId}`}>
                                Reason for Bypass <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id={`bypass-reason-${changeId}`}
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
        </>
    );
}
