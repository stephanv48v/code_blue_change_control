import { Head, Link } from '@inertiajs/react';
import {
    Calendar,
    FileText,
    CheckCircle,
    Clock,
    ArrowRight,
    History
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EventCalendar, type CalendarEvent } from '@/components/changes/event-calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import AppLayout from '@/layouts/app-layout';


interface ChangeRequest {
    id: number;
    change_id: string;
    title: string;
    status: string;
    priority: string;
    client?: { name: string } | null;
    requester?: { name: string } | null;
    scheduled_start_date?: string;
}

interface Agenda {
    meeting_date: string;
    meeting?: {
        id: number;
        status: string;
        agenda_items: number;
    };
    calendar_meetings?: Array<{
        id: number;
        meeting_date: string;
        status: string;
        agenda_items: number;
    }>;
    pending_reviews: ChangeRequest[];
    upcoming_changes: ChangeRequest[];
    total_pending: number;
    total_upcoming: number;
}

interface Props {
    agenda: Agenda;
}

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

const priorityColors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
};

export default function CabAgenda({ agenda }: Props) {
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
        href: '/cab-agenda/meetings',
    }));

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'CAB Agenda', href: '/cab-agenda' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CAB Agenda" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">CAB Agenda</h1>
                        <p className="text-muted-foreground">
                            Change Advisory Board meeting agenda for {new Date(agenda.meeting_date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/cab-agenda/meetings">
                            <Button variant="outline">
                                <Calendar className="h-4 w-4 mr-2" />
                                CAB Meetings
                            </Button>
                        </Link>
                        <Link href="/cab-agenda/history">
                            <Button variant="outline">
                                <History className="h-4 w-4 mr-2" />
                                Review History
                            </Button>
                        </Link>
                        <Link href="/changes">
                            <Button variant="outline">
                                <FileText className="h-4 w-4 mr-2" />
                                All Changes
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending Review</p>
                                    <p className="text-2xl font-bold">{agenda.total_pending}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Upcoming This Week</p>
                                    <p className="text-2xl font-bold">{agenda.total_upcoming}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Current CAB Meeting</p>
                                    <p className="text-2xl font-bold">
                                        {agenda.meeting?.agenda_items ?? 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {agenda.meeting?.status ?? 'planned'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* CAB Calendar */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                CAB Calendar
                            </CardTitle>
                            <CardDescription>
                                Monthly view of CAB meetings and agenda load
                            </CardDescription>
                        </div>
                        <Link href="/cab-agenda/meetings">
                            <Button variant="outline">Open CAB Meetings</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <EventCalendar
                            events={calendarEvents}
                            emptyMonthMessage="No CAB meetings planned in this month."
                            emptyDayMessage="No CAB meetings on this date."
                        />
                    </CardContent>
                </Card>

                {/* Pending Reviews */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Pending Review
                        </CardTitle>
                        <CardDescription>
                            Change requests awaiting approval
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {agenda.pending_reviews.length === 0 ? (
                            <EmptyState
                                icon={CheckCircle}
                                title="No pending reviews"
                                description="All change requests have been reviewed."
                            />
                        ) : (
                            <div className="space-y-3">
                                {agenda.pending_reviews.map((change) => (
                                    <ChangeRow key={change.id} change={change} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Changes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Upcoming Changes
                        </CardTitle>
                        <CardDescription>
                            Changes scheduled for implementation
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {agenda.upcoming_changes.length === 0 ? (
                            <EmptyState
                                icon={Calendar}
                                title="No upcoming changes"
                                description="No changes scheduled for this week."
                            />
                        ) : (
                            <div className="space-y-3">
                                {agenda.upcoming_changes.map((change) => (
                                    <ChangeRow key={change.id} change={change} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function ChangeRow({ change }: { change: ChangeRequest }) {
    return (
        <Link href={`/changes/${change.id}`}>
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{change.change_id}</span>
                        <Badge className={`${statusColors[change.status] || 'bg-slate-100'} text-xs`}>
                            {change.status.replaceAll('_', ' ')}
                        </Badge>
                        <Badge className={`${priorityColors[change.priority] || 'bg-slate-100'} text-xs`}>
                            {change.priority}
                        </Badge>
                    </div>
                    <p className="font-medium truncate mt-1">{change.title}</p>
                    <p className="text-sm text-muted-foreground">
                        {change.client?.name ?? 'Unknown Client'} • Requested by{' '}
                        {change.requester?.name ?? 'Unknown Requester'}
                    </p>
                    {change.scheduled_start_date && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            Scheduled for {new Date(change.scheduled_start_date).toLocaleDateString()}
                        </p>
                    )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
        </Link>
    );
}
