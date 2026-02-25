import { router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChangeRequest } from '@/types';

interface CabConditionsBannerProps {
    change: ChangeRequest;
    isRequester: boolean;
}

export function CabConditionsBanner({ change, isRequester }: CabConditionsBannerProps) {
    if (!change.cab_conditions) return null;

    const isPending = change.cab_conditions_status === 'pending';

    return (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50/60 p-4 dark:border-yellow-900 dark:bg-yellow-950/20">
            <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium">CAB Conditions Must Be Acknowledged</p>
                    <div className="whitespace-pre-wrap rounded border bg-white/60 p-3 text-sm dark:bg-white/5">
                        {change.cab_conditions}
                    </div>
                    {isPending && isRequester && (
                        <Button
                            size="sm"
                            onClick={() =>
                                router.post(`/changes/${change.id}/confirm-cab-conditions`, {
                                    acknowledged: true,
                                })
                            }
                        >
                            <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            Acknowledge Conditions
                        </Button>
                    )}
                    {isPending && !isRequester && (
                        <p className="text-xs text-muted-foreground">
                            Waiting for the requester to acknowledge these conditions.
                        </p>
                    )}
                    {!isPending && (
                        <p className="text-xs text-green-600">
                            Conditions acknowledged
                            {change.cab_conditions_confirmed_at
                                ? ` on ${new Date(change.cab_conditions_confirmed_at).toLocaleDateString()}`
                                : ''}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
