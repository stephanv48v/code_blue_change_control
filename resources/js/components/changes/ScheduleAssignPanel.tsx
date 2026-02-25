import { useForm, usePage } from '@inertiajs/react';
import { CalendarClock, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChangeRequest, Engineer, SharedData } from '@/types';

interface ScheduleAssignPanelProps {
    change: ChangeRequest;
    engineers: Engineer[];
}

function toDateTimeLocal(value?: string | null): string {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    const year = parsed.getFullYear();
    const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
    const day = `${parsed.getDate()}`.padStart(2, '0');
    const hours = `${parsed.getHours()}`.padStart(2, '0');
    const minutes = `${parsed.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function ScheduleAssignPanel({ change, engineers }: ScheduleAssignPanelProps) {
    const { auth } = usePage<SharedData>().props;
    const canEdit = auth.user?.permissions?.includes('changes.edit') ?? false;
    const pageErrors = usePage().props.errors as Record<string, string> | undefined;

    // Build the engineer options, ensuring the requester is always included
    const requesterInList = engineers.some((eng) => eng.id === change.requester_id);
    const engineerOptions = requesterInList
        ? engineers
        : [
              { id: change.requester_id, name: change.requester?.name ?? 'Requester' },
              ...engineers,
          ];

    const scheduleForm = useForm({
        scheduled_start_date: toDateTimeLocal(change.scheduled_start_date),
        scheduled_end_date: toDateTimeLocal(change.scheduled_end_date),
    });

    const assignForm = useForm({
        engineer_id: change.assigned_engineer_id
            ? String(change.assigned_engineer_id)
            : String(change.requester_id),
    });

    return (
        <div className="space-y-4">
            {/* Schedule */}
            <form
                className="space-y-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    scheduleForm.post(`/changes/${change.id}/schedule`);
                }}
            >
                <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Schedule Implementation Window</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Start Date & Time</label>
                        <Input
                            type="datetime-local"
                            value={scheduleForm.data.scheduled_start_date}
                            onChange={(e) =>
                                scheduleForm.setData('scheduled_start_date', e.target.value)
                            }
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">End Date & Time</label>
                        <Input
                            type="datetime-local"
                            value={scheduleForm.data.scheduled_end_date}
                            onChange={(e) =>
                                scheduleForm.setData('scheduled_end_date', e.target.value)
                            }
                        />
                    </div>
                </div>
                {(pageErrors?.schedule || scheduleForm.errors.scheduled_start_date || scheduleForm.errors.scheduled_end_date) && (
                    <p className="text-sm text-destructive">
                        {pageErrors?.schedule || scheduleForm.errors.scheduled_start_date || scheduleForm.errors.scheduled_end_date}
                    </p>
                )}
                <Button
                    type="submit"
                    size="sm"
                    disabled={!canEdit || scheduleForm.processing}
                >
                    {change.scheduled_start_date ? 'Update Schedule' : 'Set Schedule'}
                </Button>
            </form>

            {/* Assign Engineer */}
            <form
                className="space-y-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    assignForm.post(`/changes/${change.id}/assign-engineer`);
                }}
            >
                <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Assign Engineer</p>
                    {change.assigned_engineer && (
                        <span className="text-xs text-muted-foreground">
                            (currently: {change.assigned_engineer.name})
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        className="h-9 min-w-[220px] rounded-md border bg-background px-3 text-sm"
                        value={assignForm.data.engineer_id}
                        onChange={(e) => assignForm.setData('engineer_id', e.target.value)}
                    >
                        <option value="">Select engineer</option>
                        {engineerOptions.map((eng) => (
                            <option key={eng.id} value={String(eng.id)}>
                                {eng.name}
                                {eng.id === change.requester_id ? ' (Requester)' : ''}
                            </option>
                        ))}
                    </select>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!canEdit || assignForm.processing || !assignForm.data.engineer_id}
                    >
                        Assign
                    </Button>
                </div>
            </form>
        </div>
    );
}
