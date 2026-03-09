import { Head, router, usePage } from '@inertiajs/react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { CalendarFilters } from '@/components/changes/calendar-filters';
import { EngineerRoster } from '@/components/changes/engineer-roster';
import { CalendarLegend, EventCalendar, type CalendarEvent, type CalendarView } from '@/components/changes/event-calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { SharedData } from '@/types';

type CalendarChange = {
    id: number;
    change_id: string;
    title: string;
    status: string;
    priority: string;
    change_type: string | null;
    scheduled_start_date: string | null;
    scheduled_end_date: string | null;
    client: { id: number; name: string } | null;
    requester: { id: number; name: string } | null;
    assigned_engineer: { id: number; name: string } | null;
};

type Props = {
    changes: CalendarChange[];
    engineers: Array<{ id: number; name: string }>;
    clients: Array<{ id: number; name: string }>;
    filters: {
        view?: string;
        date?: string;
        tab?: string;
        engineer?: string;
        client?: string;
        status?: string;
        priority?: string;
    };
    canCreate: boolean;
};

const statusTone: Record<string, CalendarEvent['tone']> = {
    scheduled: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger',
};

export default function CalendarIndex({ changes, engineers, clients, filters, canCreate }: Props) {
    const { auth } = usePage<SharedData>().props;

    const [activeTab, setActiveTab] = useState(() => filters.tab || 'calendar');

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', value);
        window.history.replaceState({}, '', url.toString());
    };

    // Map changes to calendar events
    const calendarEvents: CalendarEvent[] = changes
        .filter((c) => c.scheduled_start_date)
        .map((change) => ({
            id: change.id,
            date: change.scheduled_start_date!,
            endDate: change.scheduled_end_date ?? undefined,
            title: `${change.change_id} – ${change.title}`,
            description: change.client?.name ?? undefined,
            badge: change.status.replaceAll('_', ' '),
            tone: statusTone[change.status] ?? 'default',
            href: `/changes/${change.id}`,
        }));

    const handleViewChange = (view: CalendarView) => {
        router.get(
            '/calendar',
            { ...stripEmpty(filters), view },
            { preserveState: true, replace: true },
        );
    };

    const handleDateChange = (date: string) => {
        router.get(
            '/calendar',
            { ...stripEmpty(filters), date },
            { preserveState: true, replace: true },
        );
    };

    const handleDateClick = (date: string) => {
        if (canCreate) {
            router.visit(`/changes/create?scheduled_date=${date}`);
        }
    };

    const handleCellClick = (engineerId: number, date: string) => {
        if (canCreate) {
            router.visit(`/changes/create?scheduled_date=${date}&engineer_id=${engineerId}`);
        }
    };

    const highlightEngineerId = filters.engineer ? Number(filters.engineer) : undefined;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: dashboard().url },
                { title: 'Calendar', href: '/calendar' },
            ]}
        >
            <Head title="Calendar" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Calendar</h1>
                    <p className="text-muted-foreground">
                        View all scheduled changes. Click a date to add a new change, or click an event to edit.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <div className="flex items-center justify-between gap-4">
                        <TabsList>
                            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                            <TabsTrigger value="roster">Engineer Roster</TabsTrigger>
                        </TabsList>

                        <CalendarLegend />
                    </div>

                    {/* Shared Filters */}
                    <div className="mt-4">
                        <CalendarFilters filters={filters} engineers={engineers} clients={clients} />
                    </div>

                    {canCreate && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            Click a date to create a change request
                        </p>
                    )}

                    {/* Calendar Tab */}
                    <TabsContent value="calendar" className="mt-4">
                        <EventCalendar
                            events={calendarEvents}
                            view={(filters.view as CalendarView) ?? 'week'}
                            onViewChange={handleViewChange}
                            onDateChange={handleDateChange}
                            onDateClick={handleDateClick}
                            initialDate={filters.date}
                            emptyMessage="No scheduled changes found."
                        />
                    </TabsContent>

                    {/* Roster Tab */}
                    <TabsContent value="roster" className="mt-4">
                        <EngineerRoster
                            changes={changes}
                            engineers={engineers}
                            initialDate={filters.date}
                            onDateChange={handleDateChange}
                            onCellClick={handleCellClick}
                            highlightEngineerId={highlightEngineerId}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

function stripEmpty(obj: Record<string, string | undefined | null>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value) result[key] = value;
    }
    return result;
}
