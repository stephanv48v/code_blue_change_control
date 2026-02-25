import { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock3,
    Pause,
    Play,
    Plus,
    RotateCcw,
    Send,
    Settings2,
    SkipForward,
    Wrench,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
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

const STATUS_COLOURS: Record<string, string> = {
    draft: 'bg-slate-500',
    submitted: 'bg-blue-500',
    pending_approval: 'bg-amber-500',
    approved: 'bg-emerald-500',
    scheduled: 'bg-indigo-500',
    in_progress: 'bg-orange-500',
    completed: 'bg-green-600',
    cancelled: 'bg-red-500',
    rejected: 'bg-red-500',
};

const PRIMARY_ACTION: Record<string, { status: string; label: string }> = {
    scheduled: { status: 'in_progress', label: 'Start Change' },
    in_progress: { status: 'completed', label: 'Complete Change' },
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

function CollapsibleSection({
    title,
    icon: Icon,
    count,
    defaultOpen = false,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <Card>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer select-none hover:bg-accent/50 transition-colors">
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Icon className="h-5 w-5" />
                                {title}
                                {count !== undefined && count > 0 && (
                                    <Badge variant="secondary" className="ml-1">{count}</Badge>
                                )}
                            </span>
                            {open ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                        </CardTitle>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="space-y-4">
                        {children}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}

export default function Operations({ change, engineers }: Props) {
    const { auth } = usePage<SharedData>().props;
    const canEdit = auth.user?.permissions?.includes('changes.edit') ?? false;
    const canApprove = auth.user?.permissions?.includes('changes.approve') ?? false;
    const [showAddStep, setShowAddStep] = useState(false);

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

    // Runbook progress
    const completedSteps = runbookSteps.filter((s) => s.status === 'completed' || s.status === 'skipped').length;
    const totalSteps = runbookSteps.length;
    const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    // Primary action for the status banner
    const primaryAction = PRIMARY_ACTION[change.status];
    const statusColour = STATUS_COLOURS[change.status] ?? 'bg-slate-500';

    // Show PIR only when change is in_progress or completed
    const showPir = change.status === 'in_progress' || change.status === 'completed';

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

            <div className="flex h-full flex-1 flex-col gap-4 p-6">
                {/* ─── Status Banner ─── */}
                <Card>
                    <CardContent className="px-6 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-semibold">
                                        {change.change_id}
                                    </h1>
                                    <Badge className={`${statusColour} text-white capitalize`}>
                                        {change.status.replaceAll('_', ' ')}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{change.title}</p>
                                {change.scheduled_start_date && (
                                    <p className="text-xs text-muted-foreground">
                                        Window: {new Date(change.scheduled_start_date).toLocaleString()}
                                        {change.scheduled_end_date
                                            ? ` — ${new Date(change.scheduled_end_date).toLocaleString()}`
                                            : ''}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {primaryAction && (
                                    <Button
                                        size="lg"
                                        disabled={!canEdit}
                                        onClick={() =>
                                            router.post(`/changes/${change.id}/transition`, {
                                                status: primaryAction.status,
                                                reason: '',
                                            })
                                        }
                                    >
                                        {primaryAction.status === 'in_progress' ? (
                                            <Play className="mr-2 h-4 w-4" />
                                        ) : (
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                        )}
                                        {primaryAction.label}
                                    </Button>
                                )}
                                <Link href={`/changes/${change.id}`}>
                                    <Button variant="outline">Back to Change</Button>
                                </Link>
                            </div>
                        </div>

                        {/* Runbook progress bar */}
                        {totalSteps > 0 && (
                            <div className="mt-4 space-y-1">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Runbook Progress</span>
                                    <span>
                                        {completedSteps}/{totalSteps} steps ({progressPercent}%)
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted">
                                    <div
                                        className="h-2 rounded-full bg-green-500 transition-all duration-300"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ─── Runbook Steps (Primary Content) ─── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Wrench className="h-5 w-5" />
                                Runbook Steps
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAddStep(!showAddStep)}
                            >
                                <Plus className="mr-1 h-3 w-3" />
                                Add Step
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {showAddStep && (
                            <form
                                className="rounded-md border border-dashed p-3 space-y-2"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    runbookForm.post(`/changes/${change.id}/runbook-steps`, {
                                        onSuccess: () => {
                                            runbookForm.reset();
                                            setShowAddStep(false);
                                        },
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
                                    <div className="flex gap-2">
                                        <Button type="submit" size="sm" disabled={!canEdit || runbookForm.processing}>
                                            Save
                                        </Button>
                                        <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddStep(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                                <Textarea
                                    rows={2}
                                    placeholder="Instructions (optional)"
                                    value={runbookForm.data.instructions}
                                    onChange={(event) =>
                                        runbookForm.setData('instructions', event.target.value)
                                    }
                                />
                            </form>
                        )}

                        {runbookSteps.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No runbook steps defined yet. Click "Add Step" to create one.
                            </p>
                        )}

                        {runbookSteps.map((step) => {
                            const statusBadgeClass: Record<string, string> = {
                                pending: '',
                                in_progress: 'border-blue-500 bg-blue-500/10 text-blue-600',
                                completed: 'border-green-500 bg-green-500/10 text-green-600',
                                skipped: 'border-slate-400 bg-slate-400/10 text-slate-500',
                            };

                            const isActive = step.status === 'in_progress';

                            return (
                                <div
                                    key={step.id}
                                    className={`rounded-md border p-3 ${isActive ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20' : ''}`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                                                step.status === 'completed'
                                                    ? 'bg-green-500 text-white'
                                                    : step.status === 'in_progress'
                                                      ? 'bg-blue-500 text-white'
                                                      : step.status === 'skipped'
                                                        ? 'bg-slate-400 text-white'
                                                        : 'bg-muted text-muted-foreground'
                                            }`}>
                                                {step.status === 'completed' ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                ) : (
                                                    step.step_order
                                                )}
                                            </span>
                                            <p className="font-medium">{step.title}</p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={statusBadgeClass[step.status] ?? ''}
                                        >
                                            {step.status.replaceAll('_', ' ')}
                                        </Badge>
                                    </div>

                                    {step.instructions && (
                                        <p className="mt-1 ml-8 text-sm text-muted-foreground">
                                            {step.instructions}
                                        </p>
                                    )}

                                    {step.completed_at && (
                                        <p className="mt-1 ml-8 text-xs text-muted-foreground">
                                            Completed {new Date(step.completed_at).toLocaleString()}
                                            {step.completedBy?.name ? ` by ${step.completedBy.name}` : ''}
                                        </p>
                                    )}

                                    <div className="mt-2 ml-8 flex flex-wrap gap-2">
                                        {step.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    disabled={!canEdit}
                                                    onClick={() =>
                                                        router.put(
                                                            `/changes/${change.id}/runbook-steps/${step.id}`,
                                                            { status: 'in_progress' },
                                                        )
                                                    }
                                                >
                                                    <Play className="mr-1 h-3 w-3" />
                                                    Start
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={!canEdit}
                                                    onClick={() =>
                                                        router.put(
                                                            `/changes/${change.id}/runbook-steps/${step.id}`,
                                                            { status: 'skipped' },
                                                        )
                                                    }
                                                >
                                                    <SkipForward className="mr-1 h-3 w-3" />
                                                    Skip
                                                </Button>
                                            </>
                                        )}
                                        {step.status === 'in_progress' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={!canEdit}
                                                    onClick={() =>
                                                        router.put(
                                                            `/changes/${change.id}/runbook-steps/${step.id}`,
                                                            { status: 'pending' },
                                                        )
                                                    }
                                                >
                                                    <Pause className="mr-1 h-3 w-3" />
                                                    Stop
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    disabled={!canEdit}
                                                    onClick={() =>
                                                        router.put(
                                                            `/changes/${change.id}/runbook-steps/${step.id}`,
                                                            { status: 'completed' },
                                                        )
                                                    }
                                                >
                                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                                    Complete
                                                </Button>
                                            </>
                                        )}
                                        {(step.status === 'completed' || step.status === 'skipped') && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={!canEdit}
                                                onClick={() =>
                                                    router.put(
                                                        `/changes/${change.id}/runbook-steps/${step.id}`,
                                                        { status: 'pending' },
                                                    )
                                                }
                                            >
                                                <RotateCcw className="mr-1 h-3 w-3" />
                                                Reset
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* ─── Admin Controls (Collapsible) ─── */}
                <CollapsibleSection title="Admin Controls" icon={Settings2}>
                    <div className="grid gap-4 md:grid-cols-3">
                        <form
                            className="space-y-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                scheduleForm.post(`/changes/${change.id}/schedule`);
                            }}
                        >
                            <p className="text-sm font-medium">Schedule Window</p>
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
                            <Button type="submit" size="sm" disabled={!canEdit || scheduleForm.processing}>
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
                            <select
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
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
                            <Button type="submit" size="sm" disabled={!canEdit || transitionForm.processing}>
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
                            <select
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
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
                            <Button type="submit" size="sm" disabled={!canEdit || assignForm.processing}>
                                Assign
                            </Button>
                        </form>
                    </div>
                </CollapsibleSection>

                {/* ─── Client Communications (Collapsible) ─── */}
                <CollapsibleSection title="Client Communications" icon={Send} count={communications.length}>
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
                            rows={3}
                            placeholder="Message"
                            value={communicationForm.data.message}
                            onChange={(event) =>
                                communicationForm.setData('message', event.target.value)
                            }
                        />
                        <Button type="submit" size="sm" disabled={!canEdit || communicationForm.processing}>
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
                </CollapsibleSection>

                {/* ─── Post-Implementation Review (Collapsible, only when relevant) ─── */}
                {showPir && (
                    <CollapsibleSection title="Post-Implementation Review" icon={CheckCircle2}>
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
                            <Button type="submit" size="sm" disabled={!canEdit || pirForm.processing}>
                                Save PIR
                            </Button>
                        </form>
                    </CollapsibleSection>
                )}

                {/* ─── Workflow Event Stream (Collapsible) ─── */}
                <CollapsibleSection title="Workflow Event Stream" icon={Clock3} count={workflowEvents.length}>
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
                </CollapsibleSection>
            </div>
        </AppLayout>
    );
}
