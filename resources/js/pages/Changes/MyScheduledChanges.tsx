import { Head, Link, router } from '@inertiajs/react';
import { CalendarClock, Clock, FileText, Users, User } from 'lucide-react';
import { EventCalendar, type CalendarEvent } from '@/components/changes/event-calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';

type ScheduledChange = {
    id: number;
    change_id: string;
    title: string;
    status: string;
    priority: string;
    scheduled_start_date: string | null;
    scheduled_end_date: string | null;
    participant_role: string;
    client?: { name?: string | null } | null;
    requester?: { name?: string | null } | null;
    assigned_engineer?: { name?: string | null } | null;
};

type Props = {
    changes: ScheduledChange[];
    mine_only: boolean;
    range: {
        from: string;
        to: string;
    };
};

const statusTone: Record<string, CalendarEvent['tone']> = {
    scheduled: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger',
};

export default function MyScheduledChanges({ changes, mine_only, range }: Props) {
    const events: CalendarEvent[] = changes
        .filter((change) => change.scheduled_start_date)
        .map((change) => {
            const startDate = change.scheduled_start_date ?? '';
            const endDate = change.scheduled_end_date;
            const scheduleLabel = endDate
                ? `${new Date(startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : new Date(startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return {
                id: change.id,
                date: startDate,
                title: `${change.change_id} - ${change.title}`,
                description: `${change.client?.name ?? 'Unknown Client'} • ${change.participant_role || 'Participant'} • ${scheduleLabel}`,
                badge: change.status.replaceAll('_', ' '),
                tone: statusTone[change.status] ?? 'default',
                href: `/changes/${change.id}`,
            };
        });

    const pageTitle = mine_only ? 'My Scheduled Changes' : 'Scheduled Changes';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: dashboard().url },
                { title: pageTitle, href: '/changes/my-scheduled' },
            ]}
        >
            <Head title={pageTitle} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{pageTitle}</h1>
                        <p className="text-muted-foreground">
                            {mine_only
                                ? 'Changes where you are the requester or assigned engineer.'
                                : 'All scheduled and in-progress changes across the organisation.'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Window: {new Date(range.from).toLocaleDateString()} - {new Date(range.to).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={mine_only ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                if (!mine_only) {
                                    router.get('/changes/my-scheduled', { mine_only: '1' }, { preserveState: true, replace: true });
                                }
                            }}
                        >
                            <User className="mr-1 h-4 w-4" />
                            My Changes
                        </Button>
                        <Button
                            variant={!mine_only ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                if (mine_only) {
                                    router.get('/changes/my-scheduled', { mine_only: '0' }, { preserveState: true, replace: true });
                                }
                            }}
                        >
                            <Users className="mr-1 h-4 w-4" />
                            All Changes
                        </Button>
                        <Link href="/changes">
                            <Button variant="outline" size="sm">Back to Change Requests</Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarClock className="h-5 w-5" />
                            Schedule Calendar
                        </CardTitle>
                        <CardDescription>
                            Select a date to see scheduled implementation windows.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EventCalendar
                            events={events}
                            emptyMonthMessage="No scheduled changes in this month."
                            emptyDayMessage="No scheduled changes on this date."
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{mine_only ? 'My Upcoming Changes' : 'All Upcoming Changes'}</CardTitle>
                        <CardDescription>
                            {mine_only
                                ? 'Detailed list of your scheduled and in-progress work.'
                                : 'All scheduled and in-progress changes.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {changes.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                {mine_only
                                    ? 'No scheduled changes found for your account.'
                                    : 'No scheduled changes found.'}
                            </p>
                        )}

                        {changes.map((change) => (
                            <Link
                                key={change.id}
                                href={`/changes/${change.id}`}
                                className="block rounded-md border p-3 hover:bg-accent"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                            {change.change_id} - {change.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {change.client?.name ?? 'Unknown Client'} • {change.participant_role || 'Participant'}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {change.scheduled_start_date
                                                ? new Date(change.scheduled_start_date).toLocaleString()
                                                : 'No start time'}
                                            {change.scheduled_end_date
                                                ? ` - ${new Date(change.scheduled_end_date).toLocaleString()}`
                                                : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="capitalize">
                                            {change.status.replaceAll('_', ' ')}
                                        </Badge>
                                        <Badge variant="secondary" className="capitalize">
                                            {change.priority}
                                        </Badge>
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
