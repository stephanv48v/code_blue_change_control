import { Head, Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Calendar,
    CalendarDays,
    Clock,
    History,
    PlusCircle,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { CreateMeetingModal } from '@/components/changes/cab/CreateMeetingModal';
import { OutcomesTab } from '@/components/changes/cab/OutcomesTab';
import { ReviewHistoryTab } from '@/components/changes/cab/ReviewHistoryTab';
import { UpcomingChangesTab } from '@/components/changes/cab/UpcomingChangesTab';
import { EventCalendar, type CalendarEvent } from '@/components/changes/event-calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { SharedData } from '@/types';

interface ChangeRequest {
    id: number;
    change_id: string;
    title: string;
    status: string;
    priority: string;
    description?: string | null;
    risk_level?: string | null;
    change_type?: string | null;
    scheduled_start_date?: string | null;
    scheduled_end_date?: string | null;
    client?: { name: string } | null;
    requester?: { name: string } | null;
    assigned_engineer?: { id: number; name: string } | null;
}

interface CalendarMeeting {
    id: number;
    meeting_date: string;
    status: string;
    agenda_items: number;
}

interface TalkingPoint {
    id: string;
    text: string;
    checked: boolean;
}

interface Agenda {
    meeting_date: string;
    meeting?: {
        id: number;
        status: 'planned' | 'completed' | 'cancelled';
        agenda_items: number;
        talking_points: TalkingPoint[];
    };
    calendar_meetings?: CalendarMeeting[];
    pending_reviews: ChangeRequest[];
    upcoming_changes: ChangeRequest[];
    total_pending: number;
    total_upcoming: number;
}

interface Meeting {
    id: number;
    meeting_date: string;
    status: 'planned' | 'completed' | 'cancelled';
    agenda_notes?: string | null;
    minutes?: string | null;
    completed_at?: string | null;
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
    invited_members?: Array<{
        id: number;
        name: string;
        email: string;
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
    votes: Array<{
        user: string;
        vote: 'approve' | 'reject' | 'abstain';
        comments?: string | null;
        conditional_terms?: string | null;
        voted_at?: string | null;
    }>;
}

interface CabMember {
    id: number;
    name: string;
    email: string;
}

interface CabSettings {
    default_meeting_time: string;
    auto_populate_agenda: boolean;
}

interface Props {
    agenda: Agenda;
    meetings: Meeting[];
    history: HistoryItem[];
    historySummary: {
        total_reviewed: number;
        approved: number;
        rejected: number;
        pending: number;
        with_conditions: number;
    };
    availableChanges: ChangeRequest[];
    cabMembers: CabMember[];
    upcomingChanges: ChangeRequest[];
    cabSettings?: CabSettings;
}

const meetingStatusColors: Record<string, string> = {
    planned: 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-slate-200 text-slate-600',
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

function getInitialTab(): string {
    if (typeof window === 'undefined') return 'calendar';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['calendar', 'meetings', 'outcomes', 'upcoming', 'history'].includes(tab)) {
        return tab;
    }
    return 'calendar';
}

export default function CabAgenda({
    agenda,
    meetings,
    history,
    historySummary,
    availableChanges,
    cabMembers,
    upcomingChanges,
}: Props) {
    const { flash, auth } = usePage<SharedData>().props;

    const permissions = auth.user?.permissions ?? [];
    const canManageMeetings = permissions.includes('changes.approve');

    const [activeTab, setActiveTab] = useState(getInitialTab);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const calendarEvents: CalendarEvent[] = (agenda.calendar_meetings ?? []).map((meeting) => ({
        id: meeting.id,
        date: meeting.meeting_date,
        title: 'CAB Meeting',
        description: `${meeting.agenda_items} agenda item(s)`,
        badge: meeting.status,
        tone:
            meeting.status === 'completed'
                ? 'success'
                : meeting.status === 'cancelled'
                  ? 'danger'
                  : 'info',
        href: `/cab-agenda/meetings/${meeting.id}/show`,
    }));

    const plannedMeetings = meetings.filter((m) => m.status === 'planned');
    const completedMeetings = meetings.filter((m) => m.status === 'completed');

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', value);
        window.history.replaceState({}, '', url.toString());
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'CAB Agenda', href: '/cab-agenda' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CAB Agenda" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Flash Messages */}
                {flash.message && (
                    <Alert className="border-green-200 bg-green-50 text-green-900">
                        <AlertDescription>{flash.message}</AlertDescription>
                    </Alert>
                )}
                {flash.error && (
                    <Alert variant="destructive">
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">CAB Agenda</h1>
                        <p className="text-muted-foreground">
                            Change Advisory Board meetings and reviews
                        </p>
                    </div>
                    {canManageMeetings && (
                        <Button onClick={() => setCreateModalOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Meeting Agenda
                        </Button>
                    )}
                </div>

                {/* 5-Tab Layout */}
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList variant="line" className="w-full justify-start">
                        <TabsTrigger value="calendar" className="gap-1.5">
                            <CalendarDays className="h-4 w-4" />
                            Calendar
                        </TabsTrigger>
                        <TabsTrigger value="meetings" className="gap-1.5">
                            <Users className="h-4 w-4" />
                            Meetings
                            {plannedMeetings.length > 0 && (
                                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                                    {plannedMeetings.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="outcomes" className="gap-1.5">
                            <BarChart3 className="h-4 w-4" />
                            Outcomes
                        </TabsTrigger>
                        <TabsTrigger value="upcoming" className="gap-1.5">
                            <Clock className="h-4 w-4" />
                            Upcoming Changes
                            {upcomingChanges.length > 0 && (
                                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                                    {upcomingChanges.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-1.5">
                            <History className="h-4 w-4" />
                            Review History
                        </TabsTrigger>
                    </TabsList>

                    {/* Calendar Tab */}
                    <TabsContent value="calendar">
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CalendarDays className="h-5 w-5" />
                                        CAB Calendar
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <EventCalendar
                                        events={calendarEvents}
                                        emptyMonthMessage="No CAB meetings planned in this month."
                                        emptyDayMessage="No CAB meetings on this date."
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Meetings Tab */}
                    <TabsContent value="meetings">
                        <div className="space-y-4">
                            {/* Planned Meetings */}
                            {plannedMeetings.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        Planned
                                    </h3>
                                    {plannedMeetings.map((meeting) => (
                                        <MeetingCard key={meeting.id} meeting={meeting} />
                                    ))}
                                </div>
                            )}

                            {/* Completed Meetings */}
                            {completedMeetings.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        Completed
                                    </h3>
                                    {completedMeetings.map((meeting) => (
                                        <MeetingCard key={meeting.id} meeting={meeting} />
                                    ))}
                                </div>
                            )}

                            {meetings.length === 0 && (
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col items-center justify-center text-center py-8">
                                            <div className="rounded-full bg-muted p-4 mb-4">
                                                <Users className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-lg font-medium mb-1">
                                                No meetings yet
                                            </h3>
                                            <p className="text-sm text-muted-foreground max-w-sm">
                                                Create a new meeting agenda to get started.
                                            </p>
                                            {canManageMeetings && (
                                                <Button
                                                    className="mt-4"
                                                    onClick={() => setCreateModalOpen(true)}
                                                >
                                                    <PlusCircle className="mr-2 h-4 w-4" />
                                                    New Meeting Agenda
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Outcomes Tab */}
                    <TabsContent value="outcomes">
                        <OutcomesTab
                            meetings={meetings}
                            history={history}
                            historySummary={historySummary}
                        />
                    </TabsContent>

                    {/* Upcoming Changes Tab */}
                    <TabsContent value="upcoming">
                        <UpcomingChangesTab changes={upcomingChanges} />
                    </TabsContent>

                    {/* Review History Tab */}
                    <TabsContent value="history">
                        <ReviewHistoryTab
                            history={history}
                            summary={historySummary}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Create Meeting Modal */}
            <CreateMeetingModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                availableChanges={availableChanges}
                cabMembers={cabMembers}
            />
        </AppLayout>
    );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
    const changeCount = meeting.change_requests_count ?? meeting.change_requests.length;
    const memberCount = meeting.invited_members_count ?? meeting.invited_members?.length ?? 0;

    return (
        <Link href={`/cab-agenda/meetings/${meeting.id}/show`}>
            <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium">
                                    {formatMeetingDate(meeting.meeting_date)}
                                </span>
                                <Badge
                                    className={
                                        meetingStatusColors[meeting.status] ||
                                        'bg-slate-100 text-slate-800'
                                    }
                                >
                                    {meeting.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span>{changeCount} agenda item{changeCount !== 1 ? 's' : ''}</span>
                                {memberCount > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5" />
                                        {memberCount} invited
                                    </span>
                                )}
                            </div>
                            {meeting.change_requests.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {meeting.change_requests.slice(0, 5).map((cr) => (
                                        <span
                                            key={cr.id}
                                            className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded"
                                        >
                                            {cr.change_id}
                                        </span>
                                    ))}
                                    {meeting.change_requests.length > 5 && (
                                        <span className="text-xs text-muted-foreground">
                                            +{meeting.change_requests.length - 5} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex-shrink-0 ml-4">
                            <Button variant="outline" size="sm" tabIndex={-1}>
                                View
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
