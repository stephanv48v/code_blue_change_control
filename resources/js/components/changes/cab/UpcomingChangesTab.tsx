import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    Clock,
    Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

interface ChangeRequest {
    id: number;
    change_id: string;
    title: string;
    status: string;
    priority: string;
    risk_level?: string | null;
    scheduled_start_date?: string | null;
    scheduled_end_date?: string | null;
    client?: { name: string } | null;
    requester?: { name: string } | null;
    assigned_engineer?: { id: number; name: string } | null;
}

interface UpcomingChangesTabProps {
    changes: ChangeRequest[];
}

const statusColors: Record<string, string> = {
    scheduled: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-orange-100 text-orange-800',
    approved: 'bg-green-100 text-green-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
};

const priorityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
    critical: 'bg-red-200 text-red-900',
};

const riskColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
    critical: 'bg-red-200 text-red-900',
};

function formatDate(value?: string | null): string {
    if (!value) return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function UpcomingChangesTab({ changes }: UpcomingChangesTabProps) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Upcoming Changes This Week
                        </CardTitle>
                        <Badge variant="secondary">{changes.length}</Badge>
                    </div>
                    <a href="/export/upcoming-changes">
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </a>
                </CardHeader>
                <CardContent>
                    {changes.length === 0 ? (
                        <EmptyState
                            icon={Calendar}
                            title="No changes scheduled for this week"
                            description="Scheduled changes for the current week will appear here."
                        />
                    ) : (
                        <div className="space-y-2">
                            {/* Table Header */}
                            <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                                <div className="col-span-1">ID</div>
                                <div className="col-span-3">Title</div>
                                <div className="col-span-2">Client</div>
                                <div className="col-span-1">Priority</div>
                                <div className="col-span-1">Risk</div>
                                <div className="col-span-2">Schedule</div>
                                <div className="col-span-1">Engineer</div>
                                <div className="col-span-1">Status</div>
                            </div>

                            {/* Change Rows */}
                            {changes.map((change) => (
                                <Link key={change.id} href={`/changes/${change.id}`}>
                                    <div className="rounded-lg border p-4 transition-colors hover:bg-accent">
                                        {/* Desktop layout */}
                                        <div className="hidden md:grid md:grid-cols-12 gap-3 items-center">
                                            <div className="col-span-1">
                                                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700">
                                                    {change.change_id}
                                                </span>
                                            </div>
                                            <div className="col-span-3">
                                                <p className="font-medium truncate">
                                                    {change.title}
                                                </p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {change.client?.name ?? '--'}
                                                </p>
                                            </div>
                                            <div className="col-span-1">
                                                <Badge
                                                    className={
                                                        priorityColors[change.priority] ||
                                                        'bg-slate-100 text-slate-800'
                                                    }
                                                >
                                                    {change.priority}
                                                </Badge>
                                            </div>
                                            <div className="col-span-1">
                                                {change.risk_level ? (
                                                    <Badge
                                                        className={
                                                            riskColors[change.risk_level] ||
                                                            'bg-slate-100 text-slate-800'
                                                        }
                                                    >
                                                        {change.risk_level}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        --
                                                    </span>
                                                )}
                                            </div>
                                            <div className="col-span-2">
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {formatDate(change.scheduled_start_date)}
                                                    </span>
                                                    {change.scheduled_end_date && (
                                                        <>
                                                            <ArrowRight className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate">
                                                                {formatDate(change.scheduled_end_date)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-span-1">
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {change.assigned_engineer?.name ?? '--'}
                                                </p>
                                            </div>
                                            <div className="col-span-1">
                                                <Badge
                                                    className={
                                                        statusColors[change.status] ||
                                                        'bg-slate-100 text-slate-800'
                                                    }
                                                >
                                                    {change.status.replaceAll('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Mobile layout */}
                                        <div className="md:hidden space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700">
                                                    {change.change_id}
                                                </span>
                                                <Badge
                                                    className={
                                                        statusColors[change.status] ||
                                                        'bg-slate-100 text-slate-800'
                                                    }
                                                >
                                                    {change.status.replaceAll('_', ' ')}
                                                </Badge>
                                                <Badge
                                                    className={
                                                        priorityColors[change.priority] ||
                                                        'bg-slate-100 text-slate-800'
                                                    }
                                                >
                                                    {change.priority}
                                                </Badge>
                                                {change.risk_level && (
                                                    <Badge
                                                        className={
                                                            riskColors[change.risk_level] ||
                                                            'bg-slate-100 text-slate-800'
                                                        }
                                                    >
                                                        {change.risk_level}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="font-medium">{change.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {change.client?.name ?? 'No client'}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>
                                                    {formatDate(change.scheduled_start_date)}
                                                    {change.scheduled_end_date &&
                                                        ` \u2192 ${formatDate(change.scheduled_end_date)}`}
                                                </span>
                                            </div>
                                            {change.assigned_engineer && (
                                                <p className="text-sm text-muted-foreground">
                                                    Engineer: {change.assigned_engineer.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
