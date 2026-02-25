import { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Calendar, Clock, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TodaysMeetingTab } from '@/components/changes/cab/TodaysMeetingTab';
import { CalendarMeetingsTab } from '@/components/changes/cab/CalendarMeetingsTab';
import { ReviewHistoryTab } from '@/components/changes/cab/ReviewHistoryTab';
import AppLayout from '@/layouts/app-layout';
import type { CabVoteSummary, UserCabVote } from '@/types';
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
    client?: { name: string } | null;
    requester?: { name: string } | null;
    scheduled_start_date?: string | null;
}

interface CalendarMeeting {
    id: number;
    meeting_date: string;
    status: string;
    agenda_items: number;
}

interface Agenda {
    meeting_date: string;
    meeting?: {
        id: number;
        status: 'planned' | 'completed' | 'cancelled';
        agenda_items: number;
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
    change_requests: Array<{
        id: number;
        change_id: string;
        title: string;
        status: string;
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
    agendaVoteSummaries: Record<number, CabVoteSummary>;
    agendaUserVotes: Record<number, UserCabVote>;
    availableChanges: ChangeRequest[];
}

export default function CabAgenda({
    agenda,
    meetings,
    history,
    historySummary,
    agendaVoteSummaries,
    agendaUserVotes,
    availableChanges,
}: Props) {
    const { flash, auth } = usePage<SharedData>().props;

    // Support ?tab=today|calendar|history to control which tab is active on load
    const getTabFromUrl = () => {
        if (typeof window === 'undefined') return 'today';
        const param = new URLSearchParams(window.location.search).get('tab');
        return ['today', 'calendar', 'history'].includes(param ?? '') ? param! : 'today';
    };
    const [activeTab, setActiveTab] = useState(getTabFromUrl);

    // Re-read the tab param when the page is re-rendered by Inertia (new props)
    useEffect(() => {
        setActiveTab(getTabFromUrl());
    }, [agenda.meeting_date]);
    const isCabMember = auth.user?.roles?.includes('CAB Member') ?? false;
    const permissions = auth.user?.permissions ?? [];
    const canManageMeetings =
        permissions.includes('changes.edit') || permissions.includes('changes.approve');

    const formattedDate = new Date(agenda.meeting_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

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
                <div>
                    <h1 className="text-2xl font-bold">CAB Agenda</h1>
                    <p className="text-muted-foreground">
                        Change Advisory Board meeting agenda for {formattedDate}
                    </p>
                </div>

                {/* Stats Row */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending Review</p>
                                    <p className="text-2xl font-bold">{agenda.total_pending}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Upcoming This Week</p>
                                    <p className="text-2xl font-bold">{agenda.total_upcoming}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Meeting Agenda Items</p>
                                    <p className="text-2xl font-bold">
                                        {agenda.meeting?.agenda_items ?? 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabbed Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="today">
                            Meeting Agenda
                        </TabsTrigger>
                        <TabsTrigger value="calendar">
                            Calendar & Meetings
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            Review History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="today" className="mt-4">
                        <TodaysMeetingTab
                            meetingDate={agenda.meeting_date}
                            meeting={agenda.meeting ?? null}
                            pendingReviews={agenda.pending_reviews}
                            upcomingChanges={agenda.upcoming_changes}
                            voteSummaries={agendaVoteSummaries ?? {}}
                            userVotes={agendaUserVotes ?? {}}
                            isCabMember={isCabMember}
                            canManageMeetings={canManageMeetings}
                            availableChanges={availableChanges ?? []}
                        />
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-4">
                        <CalendarMeetingsTab
                            meetings={meetings ?? []}
                            calendarMeetings={agenda.calendar_meetings ?? []}
                            canManageMeetings={canManageMeetings}
                        />
                    </TabsContent>

                    <TabsContent value="history" className="mt-4">
                        <ReviewHistoryTab
                            history={history ?? []}
                            summary={historySummary ?? {
                                total_reviewed: 0,
                                approved: 0,
                                rejected: 0,
                                pending: 0,
                                with_conditions: 0,
                            }}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
