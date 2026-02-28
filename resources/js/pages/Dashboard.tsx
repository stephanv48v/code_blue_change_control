import { Head, Link } from '@inertiajs/react';
import { 
    FileText, 
    CheckCircle, 
    Clock, 
    Calendar, 
    TrendingUp, 
    ArrowRight,
    Download,
    AlertCircle,
    User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import AppLayout from '@/layouts/app-layout';

interface Change {
    id: number;
    change_id: string;
    title: string;
    status: string;
    priority: string;
    client?: { name: string } | null;
    requester?: { name: string } | null;
    scheduled_start_date?: string | null;
}

interface KPIs {
    changes_this_month: number;
    pending_approvals: number;
    scheduled_this_month: number;
    completion_rate: number;
    integrations_active: number;
    assets_managed: number;
    sync_failures_24h: number;
    changes_requiring_cab: number;
    overdue_approvals: number;
    approval_reminders_24h: number;
    communications_sent_24h: number;
    pir_completed_this_month: number;
    runbook_completion_rate: number;
    by_status: Record<string, number>;
    recent_changes: Change[];
    upcoming_changes: Change[];
}

interface Props {
    user: {
        name: string;
        email: string;
        roles: string[];
        permissions: string[];
    };
    kpis: KPIs;
}

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-800',
    submitted: 'bg-blue-100 text-blue-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    scheduled: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-orange-100 text-orange-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-slate-200 text-slate-600',
};

const priorityColors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
};

export default function Dashboard({ user, kpis }: Props) {
    const breadcrumbs = [{ title: 'Dashboard', href: '/dashboard' }];
    const canViewChanges = user.permissions.includes('changes.view');
    const canCreateChanges = user.permissions.includes('changes.create');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Welcome Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
                        <p className="text-muted-foreground">
                            Here&apos;s what&apos;s happening with your change requests.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {canViewChanges && (
                            <Link href="/export/changes">
                                <Button variant="outline">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                </Button>
                            </Link>
                        )}
                        {canCreateChanges && (
                            <Link href="/changes/create">
                                <Button>
                                    <FileText className="h-4 w-4 mr-2" />
                                    New Change
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Change Management KPIs */}
                <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Change Management</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <KpiCard
                            icon={FileText}
                            title="Changes This Month"
                            value={kpis.changes_this_month}
                            description="New change requests created"
                            color="blue"
                            href="/changes"
                        />
                        <KpiCard
                            icon={Clock}
                            title="Pending Approvals"
                            value={kpis.pending_approvals}
                            description="Awaiting client or CAB approval"
                            color="yellow"
                            href="/changes?status=pending_approval"
                        />
                        <KpiCard
                            icon={Calendar}
                            title="Scheduled This Month"
                            value={kpis.scheduled_this_month}
                            description="Changes planned for implementation"
                            color="purple"
                            href="/changes?status=scheduled"
                        />
                        <KpiCard
                            icon={TrendingUp}
                            title="Completion Rate"
                            value={`${kpis.completion_rate}%`}
                            description="Successfully completed changes"
                            color="green"
                            href="/changes?status=completed"
                        />
                    </div>
                </div>

                {/* Approvals & Operations KPIs */}
                <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Approvals & Operations</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <KpiCard
                            icon={AlertCircle}
                            title="CAB Required"
                            value={kpis.changes_requiring_cab}
                            description="Open changes requiring CAB"
                            color="yellow"
                            href="/cab-agenda"
                        />
                        <KpiCard
                            icon={AlertCircle}
                            title="Overdue Approvals"
                            value={kpis.overdue_approvals}
                            description="Pending approvals past SLA"
                            color="red"
                            href="/changes?status=pending_approval"
                        />
                        <KpiCard
                            icon={CheckCircle}
                            title="PIR This Month"
                            value={kpis.pir_completed_this_month}
                            description="Post-implementation reviews completed"
                            color="green"
                            href="/changes?status=completed"
                        />
                        <KpiCard
                            icon={TrendingUp}
                            title="Runbook Completion"
                            value={`${kpis.runbook_completion_rate}%`}
                            description="Completed runbook steps"
                            color="purple"
                            href="/changes?status=in_progress"
                        />
                    </div>
                </div>

                {/* Integrations & Activity KPIs */}
                <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Integrations & Activity</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <KpiCard
                            icon={User}
                            title="Integrations"
                            value={kpis.integrations_active}
                            description="Active external system connections"
                            color="blue"
                            href="/admin/integrations"
                        />
                        <KpiCard
                            icon={FileText}
                            title="Managed Assets"
                            value={kpis.assets_managed}
                            description={`${kpis.sync_failures_24h} sync failures in last 24h`}
                            color="purple"
                            href="/admin/integrations"
                        />
                        <KpiCard
                            icon={Clock}
                            title="Approval Reminders"
                            value={kpis.approval_reminders_24h}
                            description="Reminder events in last 24h"
                            color="yellow"
                            href="/changes?status=submitted"
                        />
                        <KpiCard
                            icon={User}
                            title="Comms Sent (24h)"
                            value={kpis.communications_sent_24h}
                            description="Client communication dispatches"
                            color="blue"
                            href="/changes"
                        />
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Changes */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Changes</CardTitle>
                                <CardDescription>Latest change requests</CardDescription>
                            </div>
                            <Link href="/changes">
                                <Button variant="ghost" size="sm">
                                    View All
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {kpis.recent_changes.length === 0 ? (
                                <EmptyState
                                    icon={FileText}
                                    title="No changes yet"
                                    description="Create your first change request to get started."
                                />
                            ) : (
                                <div className="space-y-3">
                                    {kpis.recent_changes.map((change) => (
                                        <ChangeRow key={change.id} change={change} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Upcoming Changes */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Upcoming Changes</CardTitle>
                                <CardDescription>Next 7 days</CardDescription>
                            </div>
                            {canViewChanges && (
                                <Link href="/cab-agenda">
                                    <Button variant="ghost" size="sm">
                                        CAB Agenda
                                        <ArrowRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </Link>
                            )}
                        </CardHeader>
                        <CardContent>
                            {kpis.upcoming_changes.length === 0 ? (
                                <EmptyState
                                    icon={Calendar}
                                    title="No upcoming changes"
                                    description="No changes scheduled for the next 7 days."
                                />
                            ) : (
                                <div className="space-y-3">
                                    {kpis.upcoming_changes.map((change) => (
                                        <UpcomingRow key={change.id} change={change} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Status Breakdown */}
                {Object.keys(kpis.by_status).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Changes by Status</CardTitle>
                            <CardDescription>Overview of all change request statuses</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(kpis.by_status).map(([status, count]) => (
                                    <Link key={status} href={`/changes?status=${status}`}>
                                        <Badge
                                            className={`${statusColors[status] || 'bg-slate-100'} text-sm px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity`}
                                        >
                                            {status.replaceAll('_', ' ')}: {count}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

function KpiCard({
    icon: Icon,
    title,
    value,
    description,
    color,
    href,
}: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    description: string;
    color: 'blue' | 'yellow' | 'purple' | 'green' | 'red';
    href?: string;
}) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        purple: 'bg-purple-50 text-purple-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
    };

    const content = (
        <CardContent className="p-6">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{description}</p>
        </CardContent>
    );

    if (href) {
        return (
            <Link href={href}>
                <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                    {content}
                </Card>
            </Link>
        );
    }

    return <Card>{content}</Card>;
}

function ChangeRow({ change }: { change: Change }) {
    return (
        <Link href={`/changes/${change.id}`}>
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">{change.change_id}</span>
                        <Badge className={`${statusColors[change.status] || 'bg-slate-100'} text-xs`}>
                            {change.status.replaceAll('_', ' ')}
                        </Badge>
                    </div>
                    <p className="font-medium truncate mt-1">{change.title}</p>
                    <p className="text-sm text-muted-foreground">{change.client?.name ?? '—'}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
        </Link>
    );
}

function UpcomingRow({ change }: { change: Change }) {
    const date = change.scheduled_start_date
        ? new Date(change.scheduled_start_date).toLocaleDateString('en-GB', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        })
        : 'Not scheduled';

    return (
        <Link href={`/changes/${change.id}`}>
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{date}</span>
                        <Badge className={`${priorityColors[change.priority] || 'bg-slate-100'} text-xs`}>
                            {change.priority}
                        </Badge>
                    </div>
                    <p className="font-medium truncate mt-1">{change.title}</p>
                    <p className="text-sm text-muted-foreground">{change.client?.name ?? '—'}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
        </Link>
    );
}
