import { useForm, usePage } from '@inertiajs/react';
import { ClipboardCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { ChangeRequest, SharedData } from '@/types';

interface PirPanelProps {
    change: ChangeRequest;
}

const OUTCOME_COLOURS: Record<string, string> = {
    successful: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    partial_failure: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    rolled_back: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

export function PirPanel({ change }: PirPanelProps) {
    const { auth } = usePage<SharedData>().props;
    const canEdit = auth.user?.permissions?.includes('changes.edit') ?? false;
    const pir = change.post_implementation_review;

    const pirForm = useForm({
        outcome: pir?.outcome ?? 'successful',
        summary: pir?.summary ?? '',
        lessons_learned: pir?.lessons_learned ?? '',
        follow_up_actions: pir?.follow_up_actions ?? '',
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Post-Implementation Review
                    {pir && (
                        <Badge className={OUTCOME_COLOURS[pir.outcome] ?? ''}>
                            {pir.outcome.replaceAll('_', ' ')}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    className="space-y-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        pirForm.post(`/changes/${change.id}/post-implementation-review`);
                    }}
                >
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Outcome</label>
                        <select
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                            value={pirForm.data.outcome}
                            disabled={!canEdit}
                            onChange={(e) => pirForm.setData('outcome', e.target.value)}
                        >
                            <option value="successful">Successful</option>
                            <option value="partial_failure">Partial failure</option>
                            <option value="failed">Failed</option>
                            <option value="rolled_back">Rolled back</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Summary</label>
                        <Textarea
                            rows={3}
                            placeholder="Brief summary of the implementation..."
                            value={pirForm.data.summary}
                            disabled={!canEdit}
                            onChange={(e) => pirForm.setData('summary', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                            Lessons Learned
                        </label>
                        <Textarea
                            rows={2}
                            placeholder="What went well? What could be improved?"
                            value={pirForm.data.lessons_learned}
                            disabled={!canEdit}
                            onChange={(e) => pirForm.setData('lessons_learned', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                            Follow-up Actions
                        </label>
                        <Textarea
                            rows={2}
                            placeholder="Any follow-up actions required?"
                            value={pirForm.data.follow_up_actions}
                            disabled={!canEdit}
                            onChange={(e) => pirForm.setData('follow_up_actions', e.target.value)}
                        />
                    </div>
                    {canEdit && (
                        <Button type="submit" size="sm" disabled={pirForm.processing}>
                            {pir ? 'Update PIR' : 'Save PIR'}
                        </Button>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
