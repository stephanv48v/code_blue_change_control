import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, FileText, PlusCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { SharedData } from '@/types';

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

type Props = {
    meetings: Meeting[];
};

export default function CabMeetings({ meetings }: Props) {
    const { flash, auth } = usePage<SharedData>().props;
    const generateForm = useForm({
        meeting_date: localDate(),
    });
    const permissions = auth.user?.permissions ?? [];
    const canManageMeetings =
        permissions.includes('changes.edit') || permissions.includes('changes.approve');

    const planned = meetings.filter((meeting) => meeting.status === 'planned').length;
    const completed = meetings.filter((meeting) => meeting.status === 'completed').length;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: dashboard().url },
                { title: 'CAB Agenda', href: '/cab-agenda' },
                { title: 'CAB Meetings', href: '/cab-agenda/meetings' },
            ]}
        >
            <Head title="CAB Meetings" />

            <div className="space-y-6 p-6">
                {flash.message && (
                    <Alert>
                        <AlertDescription>{flash.message}</AlertDescription>
                    </Alert>
                )}
                {flash.error && (
                    <Alert variant="destructive">
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">CAB Meetings</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage CAB agendas, outcomes, and meeting minutes.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/cab-agenda">
                            <Button variant="outline">Back to Agenda</Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-xs text-muted-foreground">Total Meetings</p>
                                <p className="text-xl font-bold">{meetings.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <FileText className="h-5 w-5 text-yellow-600" />
                            <div>
                                <p className="text-xs text-muted-foreground">Planned</p>
                                <p className="text-xl font-bold">{planned}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="text-xs text-muted-foreground">Completed</p>
                                <p className="text-xl font-bold">{completed}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Generate Meeting Agenda</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="flex flex-wrap items-end gap-3"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (!canManageMeetings) {
                                    return;
                                }
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
                                {generateForm.processing ? 'Refreshing Agenda...' : 'Generate / Refresh Agenda'}
                            </Button>
                        </form>
                        {!canManageMeetings && (
                            <p className="mt-2 text-xs text-muted-foreground">
                                You do not currently have permission to generate/refresh CAB agendas.
                            </p>
                        )}
                    </CardContent>
                </Card>

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
        </AppLayout>
    );
}

function localDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
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
        <Card>
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
                        if (!canManageMeetings) {
                            return;
                        }
                        form.put(`/cab-agenda/meetings/${meeting.id}`);
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
