import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock3, Send, Settings2, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { SharedData } from '@/types';

type Engineer = {
    id: number;
    name: string;
};

type RunbookStep = {
    id: number;
    step_order: number;
    title: string;
    instructions?: string | null;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    evidence_notes?: string | null;
    completed_at?: string | null;
    completedBy?: { name: string } | null;
};

type Communication = {
    id: number;
    stage: string;
    channel: string;
    recipients?: string[] | null;
    subject?: string | null;
    message: string;
    status: string;
    sent_at?: string | null;
    author?: { name: string } | null;
};

type WorkflowEvent = {
    id: number;
    event_type: string;
    created_at: string;
    publisher?: { name: string } | null;
};

type ChangePayload = {
    id: number;
    change_id: string;
    title: string;
    status: string;
    scheduled_start_date?: string | null;
    scheduled_end_date?: string | null;
    assigned_engineer_id?: number | null;
    runbook_steps?: RunbookStep[];
    communications?: Communication[];
    workflow_events?: WorkflowEvent[];
    post_implementation_review?: {
        outcome: string;
        summary?: string | null;
        lessons_learned?: string | null;
        follow_up_actions?: string | null;
        reviewed_at?: string | null;
    } | null;
};

type Props = {
    change: ChangePayload;
    engineers: Engineer[];
};

// Options that require the changes.approve permission to transition to
const APPROVE_REQUIRED_STATUSES = new Set(['approved', 'rejected']);

const VALID_TRANSITIONS: Record<string, { value: string; label: string }[]> = {
    draft: [
        { value: 'submitted', label: 'Submitted' },
        { value: 'cancelled', label: 'Cancelled' },
    ],
    submitted: [
        { value: 'pending_approval', label: 'Pending Approval' },
        { value: 'cancelled', label: 'Cancelled' },
    ],
    pending_approval: [
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'cancelled', label: 'Cancelled' },
    ],
    approved: [
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'cancelled', label: 'Cancelled' },
    ],
    scheduled: [
        { value: 'in_progress', label: 'In Progress' },
        { value: 'cancelled', label: 'Cancelled' },
    ],
    in_progress: [
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
    ],
    rejected: [
        { value: 'draft', label: 'Draft (Revise & Resubmit)' },
    ],
};

function toDateTimeLocal(value?: string | null): string {
    if (!value) {
        return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    const year = parsed.getFullYear();
    const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
    const day = `${parsed.getDate()}`.padStart(2, '0');
    const hours = `${parsed.getHours()}`.padStart(2, '0');
    const minutes = `${parsed.getMinutes()}`.padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function Operations({ change, engineers }: Props) {
    const { auth } = usePage<SharedData>().props;
    const canEdit = auth.user?.permissions?.includes('changes.edit') ?? false;
    const canApprove = auth.user?.permissions?.includes('changes.approve') ?? false;

    const availableTransitions = (VALID_TRANSITIONS[change.status] ?? []).filter(
        (opt) => !APPROVE_REQUIRED_STATUSES.has(opt.value) || canApprove,
    );

    const scheduleForm = useForm({
        scheduled_start_date: toDateTimeLocal(change.scheduled_start_date),
        scheduled_end_date: toDateTimeLocal(change.scheduled_end_date),
    });
    const transitionForm = useForm({
        status: availableTransitions[0]?.value ?? change.status,
        reason: '',
    });
    const assignForm = useForm({
        engineer_id: change.assigned_engineer_id ? String(change.assigned_engineer_id) : '',
    });
    const runbookForm = useForm({
        title: '',
        instructions: '',
        step_order: '',
    });
    const communicationForm = useForm({
        stage: 'pre_change',
        channel: 'email',
        recipients: '',
        subject: '',
        message: '',
    });
    const pirForm = useForm({
        outcome: change.post_implementation_review?.outcome ?? 'successful',
        summary: change.post_implementation_review?.summary ?? '',
        lessons_learned: change.post_implementation_review?.lessons_learned ?? '',
        follow_up_actions: change.post_implementation_review?.follow_up_actions ?? '',
    });

    const runbookSteps = change.runbook_steps ?? [];
    const communications = change.communications ?? [];
    const workflowEvents = change.workflow_events ?? [];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: dashboard().url },
                { title: 'Change Requests', href: '/changes' },
                { title: change.change_id, href: `/changes/${change.id}` },
                { title: 'Operations', href: `/changes/${change.id}/operations` },
            ]}
        >
            <Head title={`Operations - ${change.change_id}`} />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Operations Workspace</h1>
                        <p className="text-sm text-muted-foreground">
                            {change.change_id} - {change.title}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/changes/${change.id}`}>
                            <Button variant="outline">Back to Change</Button>
                        </Link>
                        <a href={`/changes/${change.id}/timeline.json`} target="_blank" rel="noreferrer">
                            <Button variant="outline">Timeline API</Button>
                        </a>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5" />
                                Workflow Controls
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <form
                                className="space-y-2"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    scheduleForm.post(`/changes/${change.id}/schedule`);
                                }}
                            >
                                <p className="text-sm font-medium">Schedule Window</p>
                                <div className="grid gap-2 md:grid-cols-2">
                                    <Input
                                        type="datetime-local"
                                        value={scheduleForm.data.scheduled_start_date}
                                        onChange={(event) =>
                                            scheduleForm.setData('scheduled_start_date', event.target.value)
                                        }
                                    />
                                    <Input
                                        type="datetime-local"
                                        value={scheduleForm.data.scheduled_end_date}
                                        onChange={(event) =>
                                            scheduleForm.setData('scheduled_end_date', event.target.value)
                                        }
                                    />
                                </div>
                                <Button type="submit" disabled={!canEdit || scheduleForm.processing}>
                                    Save Schedule
                                </Button>
                            </form>

                            <form
                                className="space-y-2"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    transitionForm.post(`/changes/${change.id}/transition`);
                                }}
                            >
                                <p className="text-sm font-medium">Status Transition</p>
                                <div className="grid gap-2 md:grid-cols-2">
                                    <select
                                        className="h-9 rounded-md border bg-background px-3 text-sm"
                                        value={transitionForm.data.status}
                                        onChange={(event) =>
                                            transitionForm.setData('status', event.target.value)
                                        }
                                    >
                                        {availableTransitions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <Input
                                        placeholder="Reason (optional)"
                                        value={transitionForm.data.reason}
                                        onChange={(event) =>
                                            transitionForm.setData('reason', event.target.value)
                                        }
                                    />
                                </div>
                                <Button type="submit" disabled={!canEdit || transitionForm.processing}>
                                    Apply Transition
                                </Button>
                            </form>

                            <form
                                className="space-y-2"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    assignForm.post(`/changes/${change.id}/assign-engineer`);
                                }}
                            >
                                <p className="text-sm font-medium">Assign Engineer</p>
                                <div className="flex flex-wrap gap-2">
                                    <select
                                        className="h-9 min-w-[220px] rounded-md border bg-background px-3 text-sm"
                                        value={assignForm.data.engineer_id}
                                        onChange={(event) =>
                                            assignForm.setData('engineer_id', event.target.value)
                                        }
                                    >
                                        <option value="">Select engineer</option>
                                        {engineers.map((engineer) => (
                                            <option key={engineer.id} value={String(engineer.id)}>
                                                {engineer.name}
                                            </option>
                                        ))}
                                    </select>
                                    <Button type="submit" disabled={!canEdit || assignForm.processing}>
                                        Assign
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wrench className="h-5 w-5" />
                                Runbook Steps
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form
                                className="space-y-2"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    runbookForm.post(`/changes/${change.id}/runbook-steps`, {
                                        onSuccess: () => runbookForm.reset(),
                                    });
                                }}
                            >
                                <div className="grid gap-2 md:grid-cols-3">
                                    <Input
                                        placeholder="Step title"
                                        value={runbookForm.data.title}
                                        onChange={(event) =>
                                            runbookForm.setData('title', event.target.value)
                                        }
                                    />
                                    <Input
                                        placeholder="Order"
                                        value={runbookForm.data.step_order}
                                        onChange={(event) =>
                                            runbookForm.setData('step_order', event.target.value)
                                        }
                                    />
                                    <Button type="submit" disabled={!canEdit || runbookForm.processing}>
                                        Add Step
                                    </Button>
                                </div>
                                <Textarea
                                    rows={2}
                                    placeholder="Instructions"
                                    value={runbookForm.data.instructions}
                                    onChange={(event) =>
                                        runbookForm.setData('instructions', event.target.value)
                                    }
                                />
                            </form>

                            {runbookSteps.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No runbook steps defined yet.
                                </p>
                            )}
                            {runbookSteps.map((step) => (
                                <div key={step.id} className="rounded border p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium">
                                            {step.step_order}. {step.title}
                                        </p>
                                        <Badge variant="outline">{step.status}</Badge>
                                    </div>
                                    {step.instructions && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {step.instructions}
                                        </p>
                                    )}
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={!canEdit}
                                            onClick={() =>
                                                router.put(
                                                    `/changes/${change.id}/runbook-steps/${step.id}`,
                                                    {
                                                        status: 'in_progress',
                                                    },
                                                )
                                            }
                                        >
                                            Start
                                        </Button>
                                        <Button
                                            size="sm"
                                            disabled={!canEdit}
                                            onClick={() =>
                                                router.put(
                                                    `/changes/${change.id}/runbook-steps/${step.id}`,
                                                    {
                                                        status: 'completed',
                                                    },
                                                )
                                            }
                                        >
                                            Mark Complete
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={!canEdit}
                                            onClick={() =>
                                                router.put(
                                                    `/changes/${change.id}/runbook-steps/${step.id}`,
                                                    {
                                                        status: 'skipped',
                                                    },
                                                )
                                            }
                                        >
                                            Skip
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Send className="h-5 w-5" />
                                Client Communications
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form
                                className="space-y-2"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    communicationForm.post(`/changes/${change.id}/communications`, {
                                        onSuccess: () =>
                                            communicationForm.setData({
                                                ...communicationForm.data,
                                                recipients: '',
                                                subject: '',
                                                message: '',
                                            }),
                                    });
                                }}
                            >
                                <div className="grid gap-2 md:grid-cols-2">
                                    <select
                                        className="h-9 rounded-md border bg-background px-3 text-sm"
                                        value={communicationForm.data.stage}
                                        onChange={(event) =>
                                            communicationForm.setData('stage', event.target.value)
                                        }
                                    >
                                        <option value="pre_change">Pre-change</option>
                                        <option value="in_window">In-window</option>
                                        <option value="post_change">Post-change</option>
                                        <option value="adhoc">Ad hoc</option>
                                    </select>
                                    <select
                                        className="h-9 rounded-md border bg-background px-3 text-sm"
                                        value={communicationForm.data.channel}
                                        onChange={(event) =>
                                            communicationForm.setData('channel', event.target.value)
                                        }
                                    >
                                        <option value="email">Email</option>
                                        <option value="teams">Teams</option>
                                        <option value="portal">Portal</option>
                                        <option value="slack">Slack</option>
                                        <option value="webhook">Webhook</option>
                                    </select>
                                </div>
                                <Input
                                    placeholder="Recipients (comma separated)"
                                    value={communicationForm.data.recipients}
                                    onChange={(event) =>
                                        communicationForm.setData('recipients', event.target.value)
                                    }
                                />
                                <Input
                                    placeholder="Subject"
                                    value={communicationForm.data.subject}
                                    onChange={(event) =>
                                        communicationForm.setData('subject', event.target.value)
                                    }
                                />
                                <Textarea
                                    rows={4}
                                    placeholder="Message"
                                    value={communicationForm.data.message}
                                    onChange={(event) =>
                                        communicationForm.setData('message', event.target.value)
                                    }
                                />
                                <Button type="submit" disabled={!canEdit || communicationForm.processing}>
                                    Record Communication
                                </Button>
                            </form>

                            {communications.map((communication) => (
                                <div key={communication.id} className="rounded border p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium">
                                            {communication.stage} via {communication.channel}
                                        </p>
                                        <Badge variant="outline">{communication.status}</Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {(communication.recipients ?? []).join(', ')}
                                    </p>
                                    {communication.subject && (
                                        <p className="mt-1 text-sm">{communication.subject}</p>
                                    )}
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {communication.sent_at
                                            ? `Sent ${new Date(communication.sent_at).toLocaleString()}`
                                            : 'Not sent'}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                Post-Implementation Review
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <form
                                className="space-y-2"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    pirForm.post(`/changes/${change.id}/post-implementation-review`);
                                }}
                            >
                                <select
                                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    value={pirForm.data.outcome}
                                    onChange={(event) => pirForm.setData('outcome', event.target.value)}
                                >
                                    <option value="successful">Successful</option>
                                    <option value="partial_failure">Partial failure</option>
                                    <option value="failed">Failed</option>
                                    <option value="rolled_back">Rolled back</option>
                                </select>
                                <Textarea
                                    rows={3}
                                    placeholder="Summary"
                                    value={pirForm.data.summary}
                                    onChange={(event) => pirForm.setData('summary', event.target.value)}
                                />
                                <Textarea
                                    rows={3}
                                    placeholder="Lessons learned"
                                    value={pirForm.data.lessons_learned}
                                    onChange={(event) =>
                                        pirForm.setData('lessons_learned', event.target.value)
                                    }
                                />
                                <Textarea
                                    rows={3}
                                    placeholder="Follow-up actions"
                                    value={pirForm.data.follow_up_actions}
                                    onChange={(event) =>
                                        pirForm.setData('follow_up_actions', event.target.value)
                                    }
                                />
                                <Button type="submit" disabled={!canEdit || pirForm.processing}>
                                    Save PIR
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock3 className="h-5 w-5" />
                            Workflow Event Stream
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {workflowEvents.length === 0 && (
                            <p className="text-sm text-muted-foreground">No workflow events recorded yet.</p>
                        )}
                        {workflowEvents.map((event) => (
                            <div key={event.id} className="rounded border p-3">
                                <p className="font-medium">{event.event_type}</p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(event.created_at).toLocaleString()}
                                    {event.publisher?.name ? ` - ${event.publisher.name}` : ''}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
