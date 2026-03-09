import { Head, Link, router } from '@inertiajs/react';
import { User, Users } from 'lucide-react';
import { CalendarLegend, EventCalendar, type CalendarEvent } from '@/components/changes/event-calendar';
import { Button } from '@/components/ui/button';
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
            return {
                id: change.id,
                date: change.scheduled_start_date!,
                endDate: change.scheduled_end_date ?? undefined,
                title: `${change.change_id} – ${change.title}`,
                description: `${change.client?.name ?? 'Unknown Client'} · ${change.participant_role || 'Participant'}`,
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
                        <Link href="/calendar">
                            <Button variant="outline" size="sm">Full Calendar</Button>
                        </Link>
                        <Link href="/changes">
                            <Button variant="outline" size="sm">Back to Change Requests</Button>
                        </Link>
                    </div>
                </div>

                <CalendarLegend />

                <EventCalendar
                    events={events}
                    emptyMessage={
                        mine_only
                            ? 'No scheduled changes found for your account.'
                            : 'No scheduled changes found.'
                    }
                />
            </div>
        </AppLayout>
    );
}
