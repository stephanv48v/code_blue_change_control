import { Link, useForm } from '@inertiajs/react';
import { CalendarDays, PlusCircle } from 'lucide-react';
import { EventCalendar, type CalendarEvent } from '@/components/changes/event-calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
type MeetingChange = {
    id: number;
    change_id: string;
    title: string;
    status: string;
};

type Meeting = {
    id: number;
    meeting_date: string;
    status: 'planned' | 'completed' | 'cancelled';
    agenda_notes?: string | null;
    minutes?: string | null;
    completed_at?: string | null;
    change_requests: MeetingChange[];
};

type CalendarMeeting = {
    id: number;
    meeting_date: string;
    status: string;
    agenda_items: number;
};

interface CalendarMeetingsTabProps {
    meetings: Meeting[];
    calendarMeetings: CalendarMeeting[];
    canManageMeetings: boolean;
}

function localDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function CalendarMeetingsTab({
    meetings,
    calendarMeetings,
    canManageMeetings,
}: CalendarMeetingsTabProps) {
    const generateForm = useForm({
        meeting_date: localDate(),
    });

    const calendarEvents: CalendarEvent[] = (calendarMeetings ?? []).map((meeting) => ({
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
        href: `#meeting-${meeting.id}`,
    }));

    return (
        <div className="space-y-4">
            {/* Create Agenda */}
            <Card>
                <CardHeader>
                    <CardTitle>Create Meeting Agenda</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                        Pick a date to create a new CAB meeting, then select which changes to include on the agenda.
                    </p>
                    <form
                        className="flex flex-wrap items-end gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (!canManageMeetings) return;
                            generateForm.post('/cab-agenda/meetings/generate', {
                                preserveScroll: true,
                            });
                        }}
                    >
                        <div className="space-y-1">
                            <label htmlFor="meeting_date" className="text-xs text-muted-foreground">
                                Meeting Date
                            </label>
                            <Input
                                id="meeting_date"
                                type="date"
                                value={generateForm.data.meeting_date}
                                onChange={(event) =>
                                    generateForm.setData('meeting_date', event.target.value)
                                }
                                required
                            />
                            {generateForm.errors.meeting_date && (
                                <p className="text-xs text-destructive">
                                    {generateForm.errors.meeting_date}
                                </p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            disabled={generateForm.processing || !canManageMeetings}
                            title={
                                !canManageMeetings
                                    ? 'You need changes.edit or changes.approve permission.'
                                    : undefined
                            }
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {generateForm.processing ? 'Creating...' : 'Create Agenda'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Calendar */}
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

            {/* Meeting Cards */}
            <div className="space-y-4">
                {meetings.length === 0 && (
                    <Card>
                        <CardContent className="p-6 text-sm text-muted-foreground">
                            No CAB meetings created yet.
                        </CardContent>
                    </Card>
                )}
                {meetings.map((meeting) => (
                    <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        canManageMeetings={canManageMeetings}
                    />
                ))}
            </div>
        </div>
    );
}

function MeetingCard({
    meeting,
    canManageMeetings,
}: {
    meeting: Meeting;
    canManageMeetings: boolean;
}) {
    const form = useForm({
        status: meeting.status,
        agenda_notes: meeting.agenda_notes ?? '',
        minutes: meeting.minutes ?? '',
    });

    return (
        <Card id={`meeting-${meeting.id}`}>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg">
                        {new Date(meeting.meeting_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        {meeting.change_requests.length} agenda item(s)
                    </p>
                </div>
                <Badge variant={meeting.status === 'completed' ? 'default' : 'secondary'}>
                    {meeting.status}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <p className="text-sm font-medium">Agenda Items</p>
                    {meeting.change_requests.length === 0 && (
                        <p className="text-sm text-muted-foreground">No change requests attached.</p>
                    )}
                    {meeting.change_requests.map((change) => (
                        <Link
                            key={change.id}
                            href={`/changes/${change.id}`}
                            className="block rounded border p-2 text-sm hover:bg-accent"
                        >
                            <span className="font-medium">{change.change_id}</span> - {change.title}
                        </Link>
                    ))}
                </div>

                <form
                    className="space-y-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!canManageMeetings) return;
                        form.put(`/cab-agenda/meetings/${meeting.id}`, {
                            preserveScroll: true,
                        });
                    }}
                >
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Status</label>
                        <select
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                            value={form.data.status}
                            disabled={!canManageMeetings}
                            onChange={(event) =>
                                form.setData('status', event.target.value as Meeting['status'])
                            }
                        >
                            <option value="planned">Planned</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Agenda Notes</label>
                        <Textarea
                            rows={3}
                            disabled={!canManageMeetings}
                            value={form.data.agenda_notes}
                            onChange={(event) => form.setData('agenda_notes', event.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Minutes</label>
                        <Textarea
                            rows={5}
                            disabled={!canManageMeetings}
                            value={form.data.minutes}
                            onChange={(event) => form.setData('minutes', event.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={form.processing || !canManageMeetings}>
                        Save Meeting
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
