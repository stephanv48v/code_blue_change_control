import { router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Pause, Play, Plus, RotateCcw, SkipForward, Wrench } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ChangeRequest, SharedData } from '@/types';

interface RunbookPanelProps {
    change: ChangeRequest;
}

export function RunbookPanel({ change }: RunbookPanelProps) {
    const { auth } = usePage<SharedData>().props;
    const canEdit = auth.user?.permissions?.includes('changes.edit') ?? false;
    const [showAddStep, setShowAddStep] = useState(false);

    const runbookForm = useForm({
        title: '',
        instructions: '',
        step_order: '',
    });

    const runbookSteps = change.runbook_steps ?? [];
    const completedSteps = runbookSteps.filter(
        (s) => s.status === 'completed' || s.status === 'skipped',
    ).length;
    const totalSteps = runbookSteps.length;
    const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        Runbook Steps
                    </span>
                    <div className="flex items-center gap-3">
                        {totalSteps > 0 && (
                            <span className="text-xs font-normal text-muted-foreground">
                                {completedSteps}/{totalSteps} ({progressPercent}%)
                            </span>
                        )}
                        {canEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAddStep(!showAddStep)}
                            >
                                <Plus className="mr-1 h-3 w-3" />
                                Add Step
                            </Button>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {totalSteps > 0 && (
                    <div className="h-2 w-full rounded-full bg-muted">
                        <div
                            className="h-2 rounded-full bg-green-500 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                )}

                {showAddStep && (
                    <form
                        className="space-y-2 rounded-md border border-dashed p-3"
                        onSubmit={(e) => {
                            e.preventDefault();
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
                                onChange={(e) => runbookForm.setData('title', e.target.value)}
                            />
                            <Input
                                placeholder="Order"
                                value={runbookForm.data.step_order}
                                onChange={(e) => runbookForm.setData('step_order', e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={!canEdit || runbookForm.processing}
                                >
                                    Save
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowAddStep(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                        <Textarea
                            rows={2}
                            placeholder="Instructions (optional)"
                            value={runbookForm.data.instructions}
                            onChange={(e) => runbookForm.setData('instructions', e.target.value)}
                        />
                    </form>
                )}

                {runbookSteps.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No runbook steps defined yet.{canEdit ? ' Click "Add Step" to create one.' : ''}
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
                            className={`rounded-md border p-3 ${
                                isActive ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20' : ''
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                                            step.status === 'completed'
                                                ? 'bg-green-500 text-white'
                                                : step.status === 'in_progress'
                                                  ? 'bg-blue-500 text-white'
                                                  : step.status === 'skipped'
                                                    ? 'bg-slate-400 text-white'
                                                    : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
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
                                <p className="ml-8 mt-1 text-sm text-muted-foreground">
                                    {step.instructions}
                                </p>
                            )}

                            {step.completed_at && (
                                <p className="ml-8 mt-1 text-xs text-muted-foreground">
                                    Completed {new Date(step.completed_at).toLocaleString()}
                                    {step.completedBy?.name ? ` by ${step.completedBy.name}` : ''}
                                </p>
                            )}

                            {canEdit && (
                                <div className="ml-8 mt-2 flex flex-wrap gap-2">
                                    {step.status === 'pending' && (
                                        <>
                                            <Button
                                                size="sm"
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
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
