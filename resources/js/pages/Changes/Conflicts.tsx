import { Head, Link } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Conflict = {
    id: number;
    change_id: string;
    title: string;
    status: string;
    scheduled_start_date?: string | null;
    scheduled_end_date?: string | null;
};

type Props = {
    change: {
        id: number;
        change_id: string;
        title: string;
    };
    conflicts: Conflict[];
};

export default function ChangeConflicts({ change, conflicts }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Change Requests', href: '/changes' },
        { title: change.change_id, href: `/changes/${change.id}` },
        { title: 'Conflicts', href: `/changes/${change.id}/conflicts` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Conflicts - ${change.change_id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Scheduling Conflicts</h1>
                        <p className="text-muted-foreground">{change.title}</p>
                    </div>
                    <Link href={`/changes/${change.id}`}>
                        <Button variant="outline">Back to Change</Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Conflicting Changes ({conflicts.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {conflicts.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No scheduling conflicts found for this time window.
                            </p>
                        )}

                        {conflicts.map((conflict) => (
                            <div key={conflict.id} className="rounded border p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            <span className="font-medium">{conflict.title}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {conflict.change_id}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatWindow(
                                                conflict.scheduled_start_date,
                                                conflict.scheduled_end_date,
                                            )}
                                        </p>
                                    </div>
                                    <Badge variant="outline">{conflict.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function formatWindow(start?: string | null, end?: string | null): string {
    if (!start) {
        return 'Schedule not set';
    }

    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    if (Number.isNaN(startDate.getTime())) {
        return 'Schedule not set';
    }

    const startValue = startDate.toLocaleString();
    const endValue = endDate && !Number.isNaN(endDate.getTime()) ? endDate.toLocaleString() : 'Unknown';

    return `${startValue} to ${endValue}`;
}
